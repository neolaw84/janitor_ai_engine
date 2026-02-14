const TimeUtils = {
    parseDuration: function (durationStr) {
        const regex = /P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)W)?(?:([0-9]+)D)?(?:T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?)?/;
        const matches = durationStr.match(regex);

        if (!matches) return 0;

        const years = parseInt(matches[1] || 0);
        const months = parseInt(matches[2] || 0);
        const weeks = parseInt(matches[3] || 0);
        const days = parseInt(matches[4] || 0);
        const hours = parseInt(matches[5] || 0);
        const minutes = parseInt(matches[6] || 0);
        const seconds = parseInt(matches[7] || 0);

        let ms = 0;
        ms += seconds * 1000;
        ms += minutes * 60 * 1000;
        ms += hours * 60 * 60 * 1000;
        ms += days * 24 * 60 * 60 * 1000;
        ms += weeks * 7 * 24 * 60 * 60 * 1000;
        ms += months * 30 * 24 * 60 * 60 * 1000;
        ms += years * 365 * 24 * 60 * 60 * 1000;

        return ms;
    },

    addDuration: function (dateStr, duration) {
        const date = new Date(dateStr);
        let msToAdd = 0;

        if (typeof duration === 'string') {
            msToAdd = this.parseDuration(duration);
        } else {
            msToAdd = duration;
        }

        const newTime = date.getTime() + msToAdd;
        return new Date(newTime).toISOString().split('.')[0];
    },

    isPast: function (dateStr, referenceDateStr) {
        const date = new Date(dateStr);
        const refDate = new Date(referenceDateStr);
        return date < refDate;
    },

    // Check if valid "yyyy-mm-ddTHH:MM:SS" format
    isValidDateStr: function (dateStr) {
        const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
        if (!regex.test(dateStr)) return false;
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    },

    // Format Date object to "yyyy-mm-ddTHH:MM:SS"
    formatDate: function (date) {
        const pad = function (num) { return (num < 10 ? '0' : '') + num; };
        return date.getFullYear() +
            '-' + pad(date.getMonth() + 1) +
            '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) +
            ':' + pad(date.getMinutes()) +
            ':' + pad(date.getSeconds());
    }
};


if (typeof module !== 'undefined') module.exports = TimeUtils;
