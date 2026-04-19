# Final System Test Plan

This plan validates the full workflow across backend and frontend for release sign-off.

## 1) Test Environment

- Backend running on http://localhost:5001 (or update BASE_URL in test_api.py).
- Frontend running on http://localhost:3000.
- Use latest code for:
  - API contract and AI coaching sections
  - recommendations UI rendering
  - responsive form and report layout

## 2) Student Profile Matrix

Run these profile scenarios and capture results in a test log.

### A. At-risk profile

Input characteristics:
- low study time
- high failures
- high absences
- weaker health and higher social distraction

Expected:
- risk category is At-risk (Average is acceptable at boundaries)
- AI coaching exists
- weekly goals are present and non-empty
- quiz questions are present and non-empty

### B. Average profile

Input characteristics:
- moderate study time
- low failures
- moderate absences
- average lifestyle indicators

Expected:
- risk category is reasonable (typically Average)
- AI coaching exists
- weekly goals are present and non-empty
- quiz questions are present and non-empty

### C. High-performing profile

Input characteristics:
- high study time
- zero failures
- low absences
- strong support indicators

Expected:
- risk category is High-performing (Average is acceptable at boundaries)
- AI coaching exists
- weekly goals are present and non-empty
- quiz questions are present and non-empty

## 3) Goal Variation Testing

For the same baseline student, test at least three goals:
- high priority, short deadline, ambitious target grade
- medium priority, medium deadline, realistic target grade
- low priority, long deadline, pass-oriented target

Expected:
- endpoint returns 200 for each goal variant
- response structure remains valid
- weekly goals and quiz remain present
- study plan and next steps remain populated

## 4) Automated Backend Checks

Use the enhanced API test script:
- file: test_api.py
- coverage includes:
  - flat and nested payload formats
  - at-risk, average, high-performing scenarios
  - goal variants
  - validation failure path
  - AI sections contract checks for weekly goals and quiz

Run:
- python test_api.py

Pass criteria:
- all tests pass
- no missing weekly goals
- no missing quiz questions

## 5) UI Verification Checklist

Open the app and run each profile through the form.

### A. Submission and loading flow

Check that:
- loading indicators appear during request
- no broken or blank layout appears
- warning or fallback banners are understandable when backend is unavailable

### B. Recommendations content rendering

Check that:
- predicted grade and risk are visible
- diagnosis appears
- study plan appears
- resources appear with usable links
- next steps appear
- weekly goals section appears with at least one goal and tasks
- quiz section appears with questions, options, and answer/explanation content

### C. Goal-driven content updates

Check that:
- changing target grade/priority/deadline in form changes recommendation tone and action steps
- no UI crash when goal values are empty or unusual

### D. Responsive and mobile behavior

Test widths around 375px, 768px, and desktop.

Check that:
- form fields stack correctly on small screens
- action buttons are tappable and not cramped
- recommendations cards remain readable
- long text wraps without overflow
- right-rail content reflows correctly on smaller screens

## 6) Regression Focus Areas

Before release, re-check:
- output key compatibility for quiz_questions and legacy quiz_generation
- weekly_goals and milestone_goals always available from fallback paths
- form-to-API goal mapping remains intact
- recommendations page handles missing input/session state safely

## 7) Exit Criteria (Release Ready)

Release is approved only if all are true:
- automated API tests pass
- each student profile scenario verified manually in UI
- all goal variants verified
- weekly goals and quiz visible for each test scenario
- mobile checks pass at target breakpoints
- no blocker severity UI defects remain
