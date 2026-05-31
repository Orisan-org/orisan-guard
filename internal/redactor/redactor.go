package redactor

import (
	"errors"
	"sort"

	"github.com/Orisan-org/orisan-guard/internal/placeholder"
)

type Result struct {
	Text  string                 `json:"text"`
	Items []placeholder.PlanItem `json:"items"`
}

func Apply(input string, plan []placeholder.PlanItem) (Result, error) {
	ordered := append([]placeholder.PlanItem(nil), plan...)
	sort.SliceStable(ordered, func(i, j int) bool {
		if ordered[i].Start == ordered[j].Start {
			return ordered[i].End > ordered[j].End
		}
		return ordered[i].Start > ordered[j].Start
	})

	if err := validatePlan(input, ordered); err != nil {
		return Result{}, err
	}

	output := input
	for _, item := range ordered {
		output = output[:item.Start] + item.Placeholder + output[item.End:]
	}

	return Result{
		Text:  output,
		Items: append([]placeholder.PlanItem(nil), plan...),
	}, nil
}

func validatePlan(input string, plan []placeholder.PlanItem) error {
	for i, item := range plan {
		if item.Start < 0 || item.End <= item.Start || item.End > len(input) {
			return errors.New("invalid placeholder span")
		}
		if item.Placeholder == "" {
			return errors.New("empty placeholder")
		}
		for j := i + 1; j < len(plan); j++ {
			if spansOverlap(item, plan[j]) {
				return errors.New("overlapping placeholder spans")
			}
		}
	}
	return nil
}

func spansOverlap(left, right placeholder.PlanItem) bool {
	return left.Start < right.End && right.Start < left.End
}
