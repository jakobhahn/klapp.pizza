(function (global) {
  'use strict';

  var TIME_ZONE = 'Europe/Berlin';

  function getBerlinMonthAndDay(date) {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      month: 'numeric',
      day: 'numeric'
    }).formatToParts(date || new Date());
    var values = {};

    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'month' || parts[i].type === 'day') {
        values[parts[i].type] = Number(parts[i].value);
      }
    }

    return values;
  }

  function isChristmasSeason(date) {
    var current = getBerlinMonthAndDay(date);
    var startsInSeptember = current.month > 9 || (current.month === 9 && current.day >= 1);
    var endsInDecember = current.month < 12 || (current.month === 12 && current.day <= 15);
    return startsInSeptember && endsInDecember;
  }

  function applyChristmasSeason(documentRef, date, locationRef) {
    if (!documentRef || !documentRef.documentElement) return isChristmasSeason(date);

    var active = isChristmasSeason(date);
    documentRef.documentElement.setAttribute('data-christmas-season', active ? 'active' : 'inactive');
    var seasonalPage = typeof documentRef.documentElement.getAttribute === 'function' &&
      documentRef.documentElement.getAttribute('data-seasonal-page') === 'christmas';

    if (seasonalPage) {
      documentRef.documentElement.hidden = !active;
      if (!active && locationRef && typeof locationRef.replace === 'function') {
        locationRef.replace(new URL('eventlocation-st-pauli.html', locationRef.href).href);
      }
    }

    return active;
  }

  var api = {
    timeZone: TIME_ZONE,
    isChristmasSeason: isChristmasSeason,
    applyChristmasSeason: applyChristmasSeason
  };

  global.JoschiSeasonal = api;

  if (typeof document !== 'undefined') {
    applyChristmasSeason(document, new Date(), typeof window !== 'undefined' ? window.location : null);
  }
})(typeof window !== 'undefined' ? window : globalThis);
