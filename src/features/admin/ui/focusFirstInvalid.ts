/**
 * জমা দেওয়ার পর প্রথম ভুল ঘরে ফোকাস — কিবোর্ড ও স্ক্রিন-রিডারের ব্যবহারকারী সরাসরি সেখানে যান। ভুলের লেখা পরের
 * রেন্ডারে আসে, তাই এক ফ্রেম পরে খোঁজে।
 */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  if (!form) return
  requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
}
