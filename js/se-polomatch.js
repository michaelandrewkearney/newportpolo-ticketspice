const ticketMinimums = [0, 10, 30, 45, 60, 80, 120, 150, 180, 210, 250, 300]

// ========================================
// DYNAMIC TICKET TYPE MAPPING
// ========================================

/**
 * Global mapping of ticket type names to their UUIDs
 * Built dynamically on page load by scanning hidden form inputs
 */
var TICKET_TYPE_IDS = {};

/**
 * Builds a dynamic mapping of ticket type names to UUIDs
 * Scans all hidden ticket_type_name and ticket_type_id inputs
 * Call this on page load before any validation runs
 */
function buildTicketTypeMapping() {
    TICKET_TYPE_IDS = {};

    // Find all ticket type name inputs (Ticket0TicketTypeName, Ticket1TicketTypeName, etc.)
    $('input[id$="TicketTypeName"]').each(function () {
        var ticketTypeName = $(this).val();
        var ticketIndex = $(this).attr('id').match(/Ticket(\d+)TicketTypeName/);

        if (ticketIndex && ticketTypeName) {
            var index = ticketIndex[1];
            // Get the corresponding UUID from the TicketTypeId field
            var ticketTypeId = $('#Ticket' + index + 'TicketTypeId').val();

            if (ticketTypeId) {

                // Also store by normalized name (uppercase, no spaces, for easier lookup)
                var normalizedName = ticketTypeName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
                TICKET_TYPE_IDS[normalizedName] = ticketTypeId;
            }
        }
    });

    return;
}

/**
 * Gets the UUID for a ticket type by a normalized key
 * @param {string} normalizedKey - Normalized key like "LAWN_TICKET" or "TAILGATE"
 * @returns {string|null} The UUID or null if not found
 */
function getTicketTypeId(normalizedKey) {
    return TICKET_TYPE_IDS[normalizedKey] || null;
}

/**
 * Gets total quantity for a ticket type by its name
 * @param {string} ticketTypeName - The exact ticket type name (e.g., "Lawn Ticket")
 * @returns {number} Total quantity selected across all price options
 */
function getQuantityByTypeName(ticketTypeName) {
    var typeId = getTicketTypeId(ticketTypeName);
    if (!typeId) {
        console.warn('Ticket type not found:', ticketTypeName);
        return 0;
    }
    return getTotalQuantityOfSpecificType(typeId) || 0;
}

/**
 * Debug function to display all available ticket types
 */
function listAvailableTicketTypes() {
    console.log('=== Normalized Keys ===');
    for (var key in TICKET_TYPE_IDS) {
        console.log(key + ' => ' + TICKET_TYPE_IDS[key]);
    }
}

$(document).ready(function () {
    buildTicketTypeMapping();
});

// ========================================
// WRAP submitOrder() TO ADD CUSTOM VALIDATION
// ========================================

/**
 * Wraps the original submitOrder function to inject custom validation
 * This preserves all existing validation logic while adding our own
 */
(function () {
    // Save reference to the original submitOrder function
    var originalSubmitOrder = submitOrder;

    // Redefine submitOrder to include our custom validation
    submitOrder = function () {
        var totalTailgateQty = getQuantityByTypeName("TAILGATE");
        var totalChaletQty = getQuantityByTypeName("CHALET");
        var totalLawnQty = getQuantityByTypeName("LAWN_TICKET");
        var totalSpaceQty = totalTailgateQty + totalChaletQty;
        var maximumSpacesAllowed = 1;
        var minimumRequiredLawnTickets = ticketMinimums[totalSpaceQty] || 0;
        if (totalSpaceQty > maximumSpacesAllowed) {
            SOspaceMaximumError = "There is a limit of " + maximumSpacesAllowed + " Tailgate or Chalet per household per match. Please modify your selection or inquire about a Polo Party above.";
            // Validation failed - stop submission
            alertify.alert("Notice", SOspaceMaximumError).set('modal', true).set('basic', false).pin().set({
                onclose: function () {
                    // Scroll to ticket selection when alert is closed
                    var ticketTypesElement = $('#seatsContentArea');
                    if (ticketTypesElement.length) {
                        $('html, body').animate({
                            scrollTop: ticketTypesElement.offset().top - 50
                        }, 'fast');
                    }
                }
            });
            ignoreLeaveAttempts();
            enableSubmit(origSubmitButtonText);
            return false;
        }
        if (totalLawnQty < minimumRequiredLawnTickets) {
            if (totalSpaceQty === 1 && totalTailgateQty === 1) {
                SOticketMinimumError = "Please select the required minimum number of Lawn Tickets to continue. A purchase of a Tailgate space requires a minimum of " + minimumRequiredLawnTickets + " Lawn Tickets.";
            } else if (totalSpaceQty === 1 && totalChaletQty === 1) {
                SOticketMinimumError = "Please select the required minimum number of Lawn Tickets to continue. A purchase of a Chalet space requires a minimum of " + minimumRequiredLawnTickets + " Lawn Tickets.";
            } else {
                SOticketMinimumError = "Please select the required minimum number of Lawn Tickets to continue. A purchase of " + totalSpaceQty + " Tailgate/Chalet spaces requires a minimum of " + minimumRequiredLawnTickets + " Lawn Tickets.";
            }
            // Validation failed - stop submission
            alertify.alert("Notice", SOticketMinimumError).set('modal', true).set('basic', false).pin().set({
                onclose: function () {
                    // Scroll to ticket selection when alert is closed
                    var ticketTypesElement = $('#ticket-types-content');
                    if (ticketTypesElement.length) {
                        $('html, body').animate({
                            scrollTop: ticketTypesElement.offset().top - 50
                        }, 'fast');
                    }
                }
            });
            ignoreLeaveAttempts();
            enableSubmit(origSubmitButtonText);
            return false;
        }

        // Custom validation passed - call the original submitOrder function
        return originalSubmitOrder.apply(this, arguments);
    };
})();
