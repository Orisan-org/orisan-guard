package classifier

import (
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

type Detection struct {
	// Start and End are byte offsets into the input string. This keeps spans
	// safe for Go slicing; browser/rune offset mapping belongs at an adapter
	// boundary when Guard Alpha adds UI surfaces.
	Start               int    `json:"start"`
	End                 int    `json:"end"`
	ValueHash           string `json:"value_hash"`
	DataClass           string `json:"data_class"`
	Confidence          string `json:"confidence"`
	Reason              string `json:"reason"`
	ReplacementStrategy string `json:"replacement_strategy"`
	EvidenceSafetyLevel string `json:"evidence_safety_level"`
}

type rule struct {
	dataClass           string
	re                  *regexp.Regexp
	confidence          string
	reason              string
	replacementStrategy string
	evidenceSafetyLevel string
	include             func(value string) bool
	adjust              func(value string, detection Detection) Detection
}

var rules = []rule{
	{
		dataClass:           "database_url",
		re:                  regexp.MustCompile(`\b(?:postgres(?:ql)?|mysql|mongodb|redis)://[^\s'"<>]+`),
		confidence:          "high",
		reason:              "database connection URL pattern",
		replacementStrategy: "database_url_placeholder",
		evidenceSafetyLevel: "hash_only",
	},
	{
		dataClass:           "email",
		re:                  regexp.MustCompile(`\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b`),
		confidence:          "high",
		reason:              "email address pattern",
		replacementStrategy: "email_placeholder",
		evidenceSafetyLevel: "hash_only",
	},
	{
		dataClass:           "phone_number",
		re:                  regexp.MustCompile(`\b(?:\+1[\s.\-]?)?(?:\(?\d{3}\)?[\s.\-]?)\d{3}[\s.\-]?\d{4}\b`),
		confidence:          "medium",
		reason:              "North American phone number pattern",
		replacementStrategy: "phone_number_placeholder",
		evidenceSafetyLevel: "hash_only",
	},
	{
		dataClass:           "private_key_marker",
		re:                  regexp.MustCompile(`-----BEGIN [A-Z ]*PRIVATE KEY-----|-----END [A-Z ]*PRIVATE KEY-----`),
		confidence:          "high",
		reason:              "private key block marker",
		replacementStrategy: "private_key_marker_placeholder",
		evidenceSafetyLevel: "metadata_only",
	},
	{
		dataClass:           "api_key_like_value",
		re:                  regexp.MustCompile(`\b(?:sk-(?:proj|test|live)-[A-Za-z0-9_\-]{16,}|sk_(?:test|live)_[A-Za-z0-9_\-]{16,}|ghp_[A-Za-z0-9_]{16,}|oskey_(?:proj|test|live)_[A-Za-z0-9_\-]{16,}|oghp_[A-Za-z0-9_]{16,})\b`),
		confidence:          "high",
		reason:              "provider-shaped API key or access token pattern",
		replacementStrategy: "api_key_placeholder",
		evidenceSafetyLevel: "hash_only",
		adjust:              lowerConfidenceForFake,
	},
	{
		dataClass:           "token_like_value",
		re:                  regexp.MustCompile(`\{\{GUARD_ALPHA_[A-Z_]+_\d{4,}\}\}`),
		confidence:          "info",
		reason:              "existing Guard Alpha placeholder marker",
		replacementStrategy: "idempotent_noop_for_guard_placeholders",
		evidenceSafetyLevel: "metadata_only",
	},
	{
		dataClass:           "token_like_value",
		re:                  regexp.MustCompile(`\b(?:[A-Za-z_]*(?:TOKEN|token)[A-Za-z_]*|API_KEY|apiKey|Authorization)\s*[:=]\s*"?[A-Za-z0-9_\-]{12,}"?|\b[A-Za-z0-9_\-]*synthetic[A-Za-z0-9_\-]*token[A-Za-z0-9_\-]*\b|\bFAKE[A-Z0-9]{12,}\b|\bnot-a-real-token\b|\bAPI_KEY=example\b`),
		confidence:          "medium",
		reason:              "token-like assignment or synthetic token pattern",
		replacementStrategy: "token_placeholder",
		evidenceSafetyLevel: "hash_only",
		adjust:              lowerConfidenceForFake,
	},
	{
		dataClass:           "customer_identifier",
		re:                  regexp.MustCompile(`\b(?:cus|customer|acct)[_\-][A-Za-z0-9_]{8,}\b`),
		confidence:          "high",
		reason:              "customer identifier pattern",
		replacementStrategy: "customer_identifier_placeholder",
		evidenceSafetyLevel: "hash_only",
	},
	{
		dataClass:           "internal_url",
		re:                  regexp.MustCompile(`https?://[A-Za-z0-9.\-]+(?::\d+)?/[^\s'"<>)]*`),
		confidence:          "high",
		reason:              "internal URL pattern",
		replacementStrategy: "internal_url_placeholder",
		evidenceSafetyLevel: "metadata_only",
		include:             isInternalURL,
	},
	{
		dataClass:           "internal_hostname",
		re:                  regexp.MustCompile(`\b[A-Za-z0-9][A-Za-z0-9\-]*(?:\.[A-Za-z0-9][A-Za-z0-9\-]*)*\.(?:internal|corp|local|invalid)\b`),
		confidence:          "medium",
		reason:              "internal hostname pattern",
		replacementStrategy: "internal_hostname_placeholder",
		evidenceSafetyLevel: "metadata_only",
	},
	{
		dataClass:           "ip_address",
		re:                  regexp.MustCompile(`\b(?:\d{1,3}\.){3}\d{1,3}\b`),
		confidence:          "medium",
		reason:              "IP address pattern",
		replacementStrategy: "ip_address_placeholder",
		evidenceSafetyLevel: "metadata_only",
		include:             isInternalIPv4,
	},
}

func Classify(input string) []Detection {
	var detections []Detection
	for _, r := range rules {
		matches := r.re.FindAllStringIndex(input, -1)
		for _, match := range matches {
			start, end := refineSpan(input, match[0], match[1], r.dataClass)
			value := input[start:end]
			if r.include != nil && !r.include(value) {
				continue
			}
			detection := Detection{
				Start:               start,
				End:                 end,
				ValueHash:           hashValue(value),
				DataClass:           r.dataClass,
				Confidence:          r.confidence,
				Reason:              r.reason,
				ReplacementStrategy: r.replacementStrategy,
				EvidenceSafetyLevel: r.evidenceSafetyLevel,
			}
			if r.adjust != nil {
				detection = r.adjust(value, detection)
			}
			detections = append(detections, detection)
		}
	}

	detections = resolveOverlaps(detections)
	sortDetections(detections)
	return detections
}

func refineSpan(input string, start, end int, dataClass string) (int, int) {
	if dataClass != "token_like_value" {
		return start, end
	}

	value := input[start:end]
	separator := strings.LastIndexAny(value, ":=")
	if separator == -1 {
		return start, end
	}

	refinedStart := start + separator + 1
	for refinedStart < end && (input[refinedStart] == ' ' || input[refinedStart] == '\t' || input[refinedStart] == '"' || input[refinedStart] == '\'') {
		refinedStart++
	}
	refinedEnd := end
	for refinedEnd > refinedStart && (input[refinedEnd-1] == '"' || input[refinedEnd-1] == '\'' || input[refinedEnd-1] == ',' || input[refinedEnd-1] == ';') {
		refinedEnd--
	}
	if refinedStart >= refinedEnd {
		return start, end
	}
	return refinedStart, refinedEnd
}

func sortDetections(detections []Detection) {
	sort.SliceStable(detections, func(i, j int) bool {
		if detections[i].Start == detections[j].Start {
			if detections[i].End == detections[j].End {
				return detections[i].DataClass < detections[j].DataClass
			}
			return detections[i].End < detections[j].End
		}
		return detections[i].Start < detections[j].Start
	})
}

func hashValue(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func lowerConfidenceForFake(value string, detection Detection) Detection {
	normalized := strings.ToLower(value)
	if strings.Contains(normalized, "example") ||
		strings.Contains(normalized, "changeme") ||
		strings.Contains(normalized, "not-a-real") ||
		strings.Contains(normalized, "fake") {
		detection.Confidence = "low"
		detection.Reason += "; fake/example marker present"
	}
	return detection
}

func isInternalURL(value string) bool {
	host := urlHost(value)
	if host == "" {
		return false
	}
	return isInternalHost(host) || isInternalIPv4(host)
}

func urlHost(value string) string {
	normalized := strings.ToLower(value)
	_, rest, ok := strings.Cut(normalized, "://")
	if !ok {
		return ""
	}
	hostPort, _, _ := strings.Cut(rest, "/")
	host, _, hasPort := strings.Cut(hostPort, ":")
	if hasPort {
		return host
	}
	return hostPort
}

func isInternalHost(value string) bool {
	normalized := strings.ToLower(strings.TrimSpace(value))
	return normalized == "localhost" ||
		strings.Contains(normalized, ".internal.") ||
		strings.Contains(normalized, ".corp.") ||
		strings.HasSuffix(normalized, ".internal") ||
		strings.HasSuffix(normalized, ".corp") ||
		strings.HasSuffix(normalized, ".local") ||
		strings.HasSuffix(normalized, ".invalid")
}

func isInternalIPv4(value string) bool {
	parts := strings.Split(value, ".")
	if len(parts) != 4 {
		return false
	}

	octets := make([]int, 4)
	for i, part := range parts {
		if part == "" {
			return false
		}
		octet, err := strconv.Atoi(part)
		if err != nil || octet < 0 || octet > 255 {
			return false
		}
		octets[i] = octet
	}

	return octets[0] == 10 ||
		octets[0] == 127 ||
		octets[0] == 169 && octets[1] == 254 ||
		octets[0] == 172 && octets[1] >= 16 && octets[1] <= 31 ||
		octets[0] == 192 && octets[1] == 168
}

func resolveOverlaps(detections []Detection) []Detection {
	ordered := append([]Detection(nil), detections...)
	sort.SliceStable(ordered, func(i, j int) bool {
		leftPriority := detectionPriority(ordered[i].DataClass)
		rightPriority := detectionPriority(ordered[j].DataClass)
		if leftPriority != rightPriority {
			return leftPriority < rightPriority
		}
		leftWidth := ordered[i].End - ordered[i].Start
		rightWidth := ordered[j].End - ordered[j].Start
		if leftWidth != rightWidth {
			return leftWidth > rightWidth
		}
		return ordered[i].Start < ordered[j].Start
	})

	kept := make([]Detection, 0, len(ordered))
	for _, candidate := range ordered {
		overlapsKept := false
		for _, existing := range kept {
			if spansOverlap(candidate, existing) {
				overlapsKept = true
				break
			}
		}
		if !overlapsKept {
			kept = append(kept, candidate)
		}
	}

	return kept
}

func spansOverlap(left, right Detection) bool {
	return left.Start < right.End && right.Start < left.End
}

func detectionPriority(dataClass string) int {
	switch dataClass {
	case "private_key_marker":
		return 10
	case "database_url":
		return 20
	case "internal_url":
		return 30
	case "api_key_like_value":
		return 40
	case "token_like_value":
		return 50
	case "email":
		return 60
	case "phone_number":
		return 70
	case "customer_identifier":
		return 80
	case "internal_hostname":
		return 90
	case "ip_address":
		return 100
	default:
		return 1000
	}
}
