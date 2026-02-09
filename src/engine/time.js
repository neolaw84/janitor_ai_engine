export const TimeManager = {
  /**
   * Adds an ISO 8601 duration to a date string.
   * Supports Years (Y), Months (M), Weeks (W), Days (D), Hours (H), Minutes (M), and Seconds (S).
   */
  addDuration: function (isoTime, durationStr) {
    const date = new Date(isoTime);
    // Regex matches P[n]Y[n]M[n]W[n]DT[n]H[n]M[n]S
    const regex = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/;
    const matches = durationStr.match(regex);

    if (matches) {
      const years = parseInt(matches[1] || 0);
      const months = parseInt(matches[2] || 0);
      const weeks = parseInt(matches[3] || 0);
      const days = parseInt(matches[4] || 0);
      const hours = parseInt(matches[5] || 0);
      const minutes = parseInt(matches[6] || 0);
      const seconds = parseInt(matches[7] || 0);

      date.setFullYear(date.getFullYear() + years);
      date.setMonth(date.getMonth() + months);
      date.setDate(date.getDate() + (weeks * 7) + days);
      date.setHours(date.getHours() + hours);
      date.setMinutes(date.getMinutes() + minutes);
      date.setSeconds(date.getSeconds() + seconds);
    }
    const iso = date.toISOString();
    return iso.split(".")[0] + "Z";
  },
  isExpired: function (expiryIso, currentIso) {
    return new Date(expiryIso) <= new Date(currentIso);
  },
  formatDateTime: function (isoTime) {
    const d = new Date(isoTime);
    const pad = function (n) {
      return (n < 10 ? "0" : "") + n;
    };
    const date =
      d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
    const hours = d.getUTCHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    const h12 = hours % 12 || 12;
    const time =
      pad(h12) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) + " " + ampm;
    const day = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });


    return date + " (" + day + ") " + time;
  },
};

