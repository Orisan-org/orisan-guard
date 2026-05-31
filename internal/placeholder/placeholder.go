package placeholder

import (
	"regexp"
	"sort"
	"strings"

	"github.com/Orisan-org/orisan-guard/internal/classifier"
)

type PlanItem struct {
	Start       int    `json:"start"`
	End         int    `json:"end"`
	DataClass   string `json:"data_class"`
	ValueHash   string `json:"value_hash"`
	Placeholder string `json:"placeholder"`
}

var unsafePlaceholderChars = regexp.MustCompile(`[^A-Z0-9]+`)

func Plan(input string, detections []classifier.Detection) []PlanItem {
	ordered := append([]classifier.Detection(nil), detections...)
	sort.SliceStable(ordered, func(i, j int) bool {
		if ordered[i].Start == ordered[j].Start {
			return ordered[i].End < ordered[j].End
		}
		return ordered[i].Start < ordered[j].Start
	})

	used := collectExistingPlaceholders(input)
	items := make([]PlanItem, 0, len(ordered))
	for _, detection := range ordered {
		placeholder := nextAvailablePlaceholder(detection, used)
		used[placeholder] = struct{}{}
		items = append(items, PlanItem{
			Start:       detection.Start,
			End:         detection.End,
			DataClass:   detection.DataClass,
			ValueHash:   detection.ValueHash,
			Placeholder: placeholder,
		})
	}

	return items
}

func nextAvailablePlaceholder(detection classifier.Detection, used map[string]struct{}) string {
	base := placeholderBase(detection)
	candidate := base + "}}"
	if _, ok := used[candidate]; !ok {
		return candidate
	}

	for i := 1; ; i++ {
		candidate = base + "_" + suffix(i) + "}}"
		if _, ok := used[candidate]; !ok {
			return candidate
		}
	}
}

func placeholderBase(detection classifier.Detection) string {
	class := strings.ToUpper(detection.DataClass)
	class = unsafePlaceholderChars.ReplaceAllString(class, "_")
	class = strings.Trim(class, "_")
	if class == "" {
		class = "VALUE"
	}

	hash := detection.ValueHash
	if len(hash) > 12 {
		hash = hash[:12]
	}
	if hash == "" {
		hash = "NOHASH"
	}

	return "{{GUARD_ALPHA_" + class + "_" + hash
}

func suffix(index int) string {
	const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	if index <= 0 {
		return "0"
	}

	var out []byte
	for index > 0 {
		out = append([]byte{alphabet[index%len(alphabet)]}, out...)
		index = index / len(alphabet)
	}
	return string(out)
}

func collectExistingPlaceholders(input string) map[string]struct{} {
	used := map[string]struct{}{}
	for _, match := range guardPlaceholderPattern.FindAllString(input, -1) {
		used[match] = struct{}{}
	}
	return used
}

var guardPlaceholderPattern = regexp.MustCompile(`\{\{GUARD_ALPHA_[A-Z0-9_]+\}\}`)
