// ==UserScript==
// @name         World Gym Guest Form Autofill
// @namespace    https://www.ggpx.info/
// @version      2.1
// @description  Auto-fills the World Gym Quebec guest registration form
// @author       ArunrajAdlee
// @match        https://www.ggpx.info/guestreg*
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ----- Your info — fill these in before using (examples shown in comments) -----
  const DATA = {
    email: '', // jane.doe@example.com
    firstName: '', // Jane
    lastName: '', // Doe
    yearOfBirth: '', // 1990
    gender: '', // M or F
    address: '', // 123 Main Street
    apartment: '', // 4 (leave empty if not applicable)
    city: '', // Montreal
    province: '', // Quebec
    postalCode: '', // H1A1A1
    phone: '', // 514-555-0123
    accessType: '', // GVM = Guest of VIP Member, GPC = Free trial, PD = Day pass
    cardNumber: '', // VIP0000000 (required when accessType is GVM)
  };

  // Set a field's value and fire events so the page's validators notice.
  // Empty values are skipped so blank DATA entries don't clobber the field.
  function setValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (!field || value == null || value === '') return;
    field.value = value;
    ['input', 'change', 'blur'].forEach((eventName) =>
      field.dispatchEvent(new Event(eventName, { bubbles: true })),
    );
  }

  // Check or uncheck a checkbox by clicking it (so the page's handlers run).
  function setCheckbox(checkboxId, shouldBeChecked) {
    const checkbox = document.getElementById(checkboxId);
    if (!checkbox) return;
    if (checkbox.checked !== shouldBeChecked) checkbox.click();
  }

  function fillForm() {
    // Text fields — all targeted by exact ID
    setValue('Email', DATA.email);
    setValue('FirstName', DATA.firstName);
    setValue('LastName', DATA.lastName);
    setValue('YearOfBirth', DATA.yearOfBirth);
    setValue('StreetAddress', DATA.address);
    setValue('Appartment', DATA.apartment);
    setValue('City', DATA.city);
    setValue('StateProv', DATA.province);
    setValue('PostalCode', DATA.postalCode);
    setValue('PhoneMobile', DATA.phone);

    // Gender checkboxes
    setCheckbox('GenderM', DATA.gender === 'M');
    setCheckbox('GenderF', DATA.gender === 'F');

    // Access type dropdown — its onchange shows/hides the PromoCode row
    setValue('GuestPassType', DATA.accessType);

    // Member card number (the field appears after GVM is selected)
    setValue('PromoCode', DATA.cardNumber);

    // Agreement checkboxes
    setCheckbox('GuestServicesAgreement1', true);
    setCheckbox('GuestServicesAgreement2', true);
    setCheckbox('GuestServicesAgreement3', true);
    setCheckbox('Agreement', true);
  }

  // Run immediately, then retry to catch any fields that render late.
  fillForm();
  setTimeout(fillForm, 500);
  setTimeout(fillForm, 1500);

  // The PromoCode field is added to the DOM only after GVM is selected, so
  // watch for it and fill it as soon as it appears.
  const promoCodeObserver = new MutationObserver(() =>
    setValue('PromoCode', DATA.cardNumber),
  );
  promoCodeObserver.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => promoCodeObserver.disconnect(), 10000);
})();
