import { formatDate } from "../../lib/utils";

// Full, formal multi-section letters (roughly 3 printed pages each) — pre-filled
// defaults for the "Edit & Send" modal. HR edits the text directly before sending;
// nothing here is re-validated server-side beyond basic length, so this is a
// starting point, not a locked legal template.

export function offerLetterDefaultText({ firstName, lastName, designation, department }) {
  const role = designation ?? "the offered position";
  const dept = department ?? "the relevant department";
  const today = formatDate(new Date());

  return `STACKLY
Offer of Employment

Date: ${today}

Dear ${firstName} ${lastName},

We are delighted to extend to you an offer of employment with Stackly. This letter sets out the terms and conditions of the position we are offering you. Please read it carefully, and feel free to reach out to Human Resources with any questions before signing.

1. POSITION AND DEPARTMENT

You are being offered the position of ${role} within ${dept}. Your reporting manager and exact team placement will be confirmed on or before your date of joining. This role is offered on the understanding that the responsibilities may evolve over time in line with business needs, and any material change will be discussed with you directly.

2. COMPENSATION AND BENEFITS

Your compensation package, including base salary, any applicable variable pay, and statutory benefits, has been discussed with you separately and will be detailed in your formal appointment letter following confirmation of this offer. Stackly's standard benefits include paid annual leave, sick leave, casual leave, and any statutory benefits required under applicable law.

3. PROBATION PERIOD

Your employment will be subject to an initial probation period as communicated to you by HR, during which either party may terminate the engagement with the notice period specified in your appointment letter. Confirmation of employment beyond probation is contingent on satisfactory performance.

4. WORKING HOURS AND LOCATION

Your standard working hours and primary work location will be confirmed at the time of joining and are subject to the operational needs of the department you join. Stackly reserves the right to reasonably adjust working arrangements in line with company policy.

5. CODE OF CONDUCT

As an employee of Stackly, you will be expected to adhere to the company's code of conduct, information security policies, and any other policies communicated to you from time to time. This includes maintaining professionalism in your interactions with colleagues, clients, and partners.

6. CONFIDENTIALITY

During and after your employment, you will be required to maintain the confidentiality of all proprietary, business, and client information you may access in the course of your work, in line with the confidentiality agreement you will be asked to sign upon joining.

7. DOCUMENTATION REQUIRED

To proceed with onboarding, please arrange to submit the following documents at your earliest convenience: government-issued photo ID (Aadhaar Card), PAN Card (if available), and academic marksheets for 10th standard, 12th standard, and college/university. These will be verified as part of your onboarding process.

8. ACCEPTANCE

This offer is valid for a limited period from the date of this letter. To accept this offer, please confirm your acceptance in writing (or by reply email) and complete any onboarding payment/formalities communicated separately by HR. Upon acceptance and completion of onboarding formalities, a formal Appointment Letter confirming your terms of employment will be issued to you.

We are excited about the prospect of you joining Stackly and look forward to a mutually rewarding association.

Warm regards,

Human Resources
Stackly

---
This letter does not constitute a binding contract of employment until countersigned by both parties and followed by a formal Appointment Letter.`;
}

export function appointmentLetterDefaultText({ firstName, lastName, joiningDate, designation, department }) {
  const role = designation ?? "your offered position";
  const dept = department ?? "the relevant department";
  const today = formatDate(new Date());
  const joinDate = joiningDate ? formatDate(joiningDate) : "the date agreed with HR";

  return `STACKLY
Appointment Letter

Date: ${today}

Dear ${firstName} ${lastName},

Further to your offer of employment and the completion of your onboarding formalities, we are pleased to confirm your appointment with Stackly on the following terms and conditions.

1. POSITION AND DEPARTMENT

You are appointed to the position of ${role} within ${dept}, effective from ${joinDate} ("the Effective Date"). You will report to the manager assigned to you by HR/your department head.

2. NATURE OF EMPLOYMENT

Your employment with Stackly is on a full-time basis unless otherwise agreed in writing. This appointment is subject to the policies, rules, and regulations of Stackly as may be amended from time to time.

3. COMPENSATION

Your compensation, including base salary and any applicable allowances or variable pay, has been communicated to you separately by HR and forms an integral part of this appointment. All statutory deductions (tax, provident fund, or other applicable withholdings) will be made as required by law.

4. LEAVE ENTITLEMENT

You will be entitled to leave in accordance with Stackly's leave policy, including Annual Leave, Sick Leave, Casual Leave, and any statutory leave (e.g. Maternity/Paternity) as applicable, details of which are available from HR and reflected in the HR portal.

5. PROBATION AND CONFIRMATION

Your appointment is subject to a probation period as communicated to you by HR, during which your performance and conduct will be reviewed. Confirmation of your employment following probation will be communicated to you in writing.

6. WORKING HOURS, LOCATION, AND CONDUCT

You are expected to observe the working hours and attendance norms applicable to your role and location, and to conduct yourself in accordance with Stackly's code of conduct at all times, including in your dealings with colleagues, clients, and third parties.

7. CONFIDENTIALITY AND INTELLECTUAL PROPERTY

You agree to keep confidential all proprietary and business information of Stackly and its clients, both during and after your employment. Any work product created in the course of your employment shall belong to Stackly, in accordance with the confidentiality and IP terms provided to you separately.

8. TERMINATION

This appointment may be terminated by either party by providing notice in accordance with Stackly's policies and applicable law, save for termination for cause, which may be effected without notice in accordance with company policy.

9. DOCUMENTATION ON FILE

We confirm receipt of your submitted documentation for onboarding, including identity verification (Aadhaar Card), PAN Card (where applicable), and academic marksheets (10th, 12th, and college/university), which have been recorded against your employee file.

10. ACKNOWLEDGEMENT

Please sign and return a copy of this letter to HR to acknowledge your acceptance of these terms. We are delighted to formally welcome you to Stackly and look forward to your contributions.

Warm regards,

Human Resources
Stackly

---
This Appointment Letter, together with any policies referenced herein, constitutes the terms of your employment with Stackly.`;
}
