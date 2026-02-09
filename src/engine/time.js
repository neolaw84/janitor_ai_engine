export const TimeManager = {
  addDuration: function (isoTime, durationStr) {
    const date = new Date(isoTime);
    const regex = /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = durationStr.match(regex);

    if (matches) {
      const days = parseInt(matches[1] || 0);
      const hours = parseInt(matches[2] || 0);
      const minutes = parseInt(matches[3] || 0);
      const seconds = parseInt(matches[4] || 0);

      date.setDate(date.getDate() + days);
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
};
