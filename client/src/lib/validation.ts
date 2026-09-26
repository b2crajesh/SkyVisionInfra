export interface MemberFormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth: string;
  aadhaarNumber: string;
  panNumber: string;
  sponsorMemberId: string;
  bookingAmount: string;
  nomineeName: string;
  relationship: string;
  rankId: string;
}

export type MemberFormErrors = Partial<Record<keyof MemberFormValues, string>>;

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAAR_REGEX = /^[0-9]{12}$/;
const PHONE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateMemberForm(
  values: MemberFormValues
): MemberFormErrors {
  const errors: MemberFormErrors = {};

  if (!values.name.trim()) errors.name = "Name is required.";

  if (!PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }

  if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.address.trim()) errors.address = "Address is required.";

  if (!values.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required.";
  } else {
    const dob = new Date(values.dateOfBirth);
    const now = new Date();
    if (Number.isNaN(dob.getTime()) || dob >= now) {
      errors.dateOfBirth = "Date of birth must be a valid past date.";
    }
  }

  if (!AADHAAR_REGEX.test(values.aadhaarNumber.trim())) {
    errors.aadhaarNumber = "Aadhaar number must be exactly 12 digits.";
  }

  if (!PAN_REGEX.test(values.panNumber.trim().toUpperCase())) {
    errors.panNumber = "PAN must match the format ABCDE1234F.";
  }

  const bookingAmount = Number(values.bookingAmount);
  if (
    values.bookingAmount.trim() === "" ||
    Number.isNaN(bookingAmount) ||
    bookingAmount < 0
  ) {
    errors.bookingAmount = "Booking amount must be a non-negative number.";
  }

  if (!values.nomineeName.trim()) {
    errors.nomineeName = "Nominee name is required.";
  }

  if (!values.relationship.trim()) {
    errors.relationship = "Relationship with nominee is required.";
  }

  if (!values.rankId) {
    errors.rankId = "Please select a rank.";
  }

  if (!values.sponsorMemberId) {
    errors.sponsorMemberId = "Please select a sponsor.";
  }

  return errors;
}

export interface SaleFormValues {
  memberId: string;
  plotReference: string;
  area: string;
  amount: string;
  saleDate: string;
}

export type SaleFormErrors = Partial<Record<keyof SaleFormValues, string>>;

export function validateSaleForm(values: SaleFormValues): SaleFormErrors {
  const errors: SaleFormErrors = {};
  if (!values.memberId) errors.memberId = "Please select a member.";
  if (!values.plotReference.trim())
    errors.plotReference = "Plot reference is required.";

  const area = Number(values.area);
  if (values.area.trim() === "" || Number.isNaN(area) || area <= 0) {
    errors.area = "Area must be a positive number.";
  }

  const amount = Number(values.amount);
  if (values.amount.trim() === "" || Number.isNaN(amount) || amount <= 0) {
    errors.amount = "Amount must be a positive number.";
  }

  if (!values.saleDate) errors.saleDate = "Sale date is required.";

  return errors;
}
