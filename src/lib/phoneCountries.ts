export type PhoneCountryOption = {
  dialCode: string;
  label: string;
};

/** Default dial code for Indian mobile numbers. */
export const DEFAULT_DIAL_CODE = "+91";

/** Curated list for auth phone fields (E.164 dial codes). */
export const PHONE_COUNTRIES: PhoneCountryOption[] = [
  { dialCode: "+91", label: "India +91" },
  { dialCode: "+1", label: "United States +1" },
  { dialCode: "+44", label: "United Kingdom +44" },
  { dialCode: "+61", label: "Australia +61" },
  { dialCode: "+971", label: "UAE +971" },
  { dialCode: "+966", label: "Saudi Arabia +966" },
  { dialCode: "+974", label: "Qatar +974" },
  { dialCode: "+65", label: "Singapore +65" },
  { dialCode: "+60", label: "Malaysia +60" },
  { dialCode: "+94", label: "Sri Lanka +94" },
  { dialCode: "+880", label: "Bangladesh +880" },
  { dialCode: "+977", label: "Nepal +977" },
  { dialCode: "+92", label: "Pakistan +92" },
  { dialCode: "+86", label: "China +86" },
  { dialCode: "+81", label: "Japan +81" },
  { dialCode: "+82", label: "South Korea +82" },
  { dialCode: "+49", label: "Germany +49" },
  { dialCode: "+33", label: "France +33" },
  { dialCode: "+39", label: "Italy +39" },
  { dialCode: "+34", label: "Spain +34" },
  { dialCode: "+31", label: "Netherlands +31" },
  { dialCode: "+27", label: "South Africa +27" },
  { dialCode: "+254", label: "Kenya +254" },
  { dialCode: "+234", label: "Nigeria +234" },
];
