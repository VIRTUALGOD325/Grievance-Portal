# LLM Output Format Documentation

## Overview

This document describes the expected output format from the LLM for citizen grievance processing in Mumbai. The LLM processes Hinglish (conversational/ASR-style) complaints and returns structured JSON data.

## Output Structure

The LLM returns **ONLY a JSON object** (no extra text) with the following fields:

```json
{
  "department": "string",
  "location": "string",
  "severity": "string",
  "description": "string",
  "summary": "string"
}
```

## Field Specifications

### 1. Department (string)

**Required** | **Enum**: One of three values

- `"water_supply"` - Water-related issues

  - Pipeline ruptures, leaks, bursts
  - Water quality issues (muddy, odor, contamination)
  - Supply problems (intermittent, pressure issues)
  - Water meter faults
  - Tank issues

- `"roads_and_traffic"` - Road and traffic infrastructure

  - Potholes, road damage, cave-ins
  - Traffic signals, pedestrian signals
  - Speed breakers, zebra crossings
  - Bridge issues, dividers, railings
  - Footpath damage
  - Hawker encroachment
  - Road construction debris

- `"solid_waste_management"` - Waste and sanitation
  - Garbage collection issues
  - Dustbin overflow
  - Drain/gutter blockages
  - Liquid waste leaks
  - Medical/e-waste dumping
  - Pest infestation (rats, flies, mosquitoes)
  - Sweeper service issues

### 2. Location (string)

**Required** | **May be empty**

- Specific area/locality name when mentioned in complaint
- Examples: `"Charni Road"`, `"Bhandup"`, `"Juhu Beach"`, `"Phoenix Mall Lower Parel"`
- Use empty string `""` if no explicit location is present in the complaint

### 3. Severity (string)

**Required** | **Enum**: One of four levels

- `"low"` - Minor inconveniences, non-urgent issues

  - Example: Garbage truck bell not working, minor odor issues

- `"medium"` - Moderate issues affecting daily life

  - Example: Occasional water supply problems, broken footpaths

- `"high"` - Serious problems requiring prompt attention

  - Example: Major leaks, deep potholes, safety hazards

- `"critical"` - Urgent issues with immediate health/safety risks
  - Example: Disease outbreaks, ambulance blockages, medical waste exposure

### 4. Description (string)

**Required** | **Complete factual sentence**

- Must be a complete, factual English sentence
- Should mention: **issue + location + impact** (when available)
- Clear and descriptive for official records
- Examples:
  - `"Pipeline rupture near Charni Road building has completely halted household work and activities."`
  - `"Broken public water tap behind Wadala Depot in Vikhroli is causing office delays for working residents."`
  - `"E-waste dumping near Phoenix Mall Lower Parel for the past week is causing dengue and malaria outbreaks."`

### 5. Summary (string)

**Required** | **Concise admin summary**

- Brief, admin-friendly summary
- Highlights main issue for quick review
- Suitable for dashboards and reports
- Examples:
  - `"Water pipeline burst near Charni Road building disrupting domestic routines."`
  - `"Public tap malfunction near Wadala Depot affecting office schedules."`
  - `"E-waste near Phoenix Mall Lower Parel spreading mosquito-borne diseases."`

## Example Outputs

### Water Supply Example

**Input**: `"pipeline phoot gai hai hamare building Charni Road ke paas ghar ka kaam ruk gaya"`

**Output**:

```json
{
  "department": "water_supply",
  "location": "Charni Road",
  "severity": "high",
  "description": "Pipeline rupture near Charni Road building has completely halted household work and activities.",
  "summary": "Water pipeline burst near Charni Road building disrupting domestic routines."
}
```

### Roads and Traffic Example

**Input**: `"bridge ke upar crack aa gaya railway crossing ke paas Charni Road bike gir gayi"`

**Output**:

```json
{
  "department": "roads_and_traffic",
  "location": "Charni Road",
  "severity": "critical",
  "description": "Crack development on bridge near Charni Road railway crossing caused a motorcycle accident requiring immediate attention.",
  "summary": "Bridge crack near Charni Road railway crossing causing motorcycle accidents."
}
```

### Solid Waste Management Example

**Input**: `"medical waste open mein hai mandir ke paas Mulund dogs aur crows ne faila diya hai"`

**Output**:

```json
{
  "department": "solid_waste_management",
  "location": "Mulund",
  "severity": "critical",
  "description": "Open medical waste near Mulund temple is being scattered by dogs and crows, creating biohazard risks.",
  "summary": "Medical waste dumping near Mulund temple attracting animal scattering."
}
```

## Autofill Integration Guide

### How the Autofill Should Work

1. **User Input**: User submits complaint in Hinglish (conversational/ASR text)

2. **LLM Processing**: Send input to LLM with the instruction prompt

3. **Parse Response**: Extract JSON object from LLM response

4. **Field Mapping**: Map JSON fields to form inputs

   ```
   department  → Department dropdown/selector
   location    → Location text field
   severity    → Severity/Priority selector
   description → Full description textarea
   summary     → Summary/Title field
   ```

5. **Validation**:

   - Verify `department` is one of: `water_supply`, `roads_and_traffic`, `solid_waste_management`
   - Verify `severity` is one of: `low`, `medium`, `high`, `critical`
   - Check if `location` is empty string and prompt user if needed

6. **User Review**: Allow user to review and edit auto-filled values before submission

### Implementation Notes

- The LLM returns **ONLY** the JSON object, no additional text
- All field values are strings
- Empty location (`""`) should be handled gracefully
- Consider adding a confidence score or "review required" flag for edge cases
- Store original Hinglish input alongside structured output for audit trail

## Data Source

This format specification is based on the training data in `test.jsonl` which contains 300 examples of Hinglish complaints and their structured outputs.

## Metadata Fields (from training data)

Each training example also includes metadata (not part of LLM output):

```json
{
  "tone": "neutral|polite|angry",
  "has_photo": true|false
}
```

These metadata fields are for training purposes and are **not** included in the LLM's output response.
