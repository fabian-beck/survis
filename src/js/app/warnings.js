define(['jquery'], function ($) {
    return {

        computeAllWarnings: function (entries) {
            var that = this;
            var warnings = {};
            $.each(entries, function (id, entry) {
                warnings[id] = that.computeWarnings(entry, id);
            });
            return warnings;
        },

        computeWarnings: function (entry, id) {
            var warningsList = [];
            if (editable) {
                $.each(entry, function (field, value) {
                    if (!value) {
                        warningsList.push('empty field "' + field + '"');
                    }
                });
            }
            return warningsList;
        }

    }
})

