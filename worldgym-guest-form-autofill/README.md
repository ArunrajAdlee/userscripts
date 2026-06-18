# World Gym Guest Form Autofill

Auto-fills the [World Gym Quebec](https://www.ggpx.info/guestreg) guest registration form so you don't have to retype the same details each visit.

## Install

Open [world-gym-guest-autofill.user.js](./world-gym-guest-autofill.user.js), click **Raw**, and your userscript manager ([Tampermonkey](https://www.tampermonkey.net/) / [Violentmonkey](https://violentmonkey.github.io/)) will offer to install it.

Runs automatically on `https://www.ggpx.info/guestreg*`.

## Setup

The script ships with an **empty `DATA` block** — fill it in with your details before use. Open the script (in the userscript manager's editor or this file) and edit the object near the top:

```js
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
```

The script also ticks the guest-services agreement checkboxes automatically.

## How it works

- Each field is targeted by its exact element `id`. Values are set and then `input`/`change`/`blur` events are dispatched so the form's own validators register the change.
- `fillForm()` runs on load and re-runs at 500ms and 1500ms to catch fields that render late.
- The promo-code field only appears after `GVM` is selected, so a `MutationObserver` watches for it and fills it the moment it shows up (disconnecting after 10s).

## Notes

- The script doesn't fill the 'Code d'inscription' since that is refreshed daily at your gym. You need to fill that in manually before submitting.
