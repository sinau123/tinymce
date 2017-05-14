define(
  'ephox.alloy.keying.KeyingType',

  [
    'ephox.alloy.api.events.SystemEvents',
    'ephox.alloy.api.focus.FocusManagers',
    'ephox.alloy.construct.EventHandler',
    'ephox.alloy.data.Fields',
    'ephox.alloy.navigation.KeyRules',
    'ephox.boulder.api.FieldSchema',
    'ephox.boulder.api.Objects',
    'ephox.katamari.api.Merger'
  ],

  function (SystemEvents, FocusManagers, EventHandler, Fields, KeyRules, FieldSchema, Objects, Merger) {
    var typical = function (infoSchema, stateInit, getRules, getEvents, getApis, optFocusIn) {
      var schema = function () {
        return infoSchema.concat([
          FieldSchema.defaulted('focusManager', FocusManagers.dom()),
          Fields.output('handler', me),
          Fields.output('state', stateInit)
        ]);
      };

      var processKey = function (component, simulatedEvent, keyingConfig, keyingState) {
        var rules = getRules(component, simulatedEvent, keyingConfig, keyingState);

        return KeyRules.choose(rules, simulatedEvent.event()).bind(function (rule) {
          return rule(component, simulatedEvent, keyingConfig, keyingState);
        });
      };

      var toEvents = function (keyingConfig, keyingState) {
        var otherEvents = getEvents(keyingConfig, keyingState);
        var keyEvents = Objects.wrapAll(
          optFocusIn.map(function (focusIn) {
            return {
              key: SystemEvents.focus(),
              value: EventHandler.nu({
                run: function (component, simulatedEvent) {
                  focusIn(component, keyingConfig, keyingState, simulatedEvent);
                  simulatedEvent.stop();
                }
              })
            };
          }).toArray().concat([
            {
              key: 'keydown',
              value: EventHandler.nu({
                run: function (component, simulatedEvent) {
                  processKey(component, simulatedEvent, keyingConfig, keyingState).each(function (_) {
                    simulatedEvent.stop();
                  });
                }
              })
            }
          ]
        ));
        return Merger.deepMerge(otherEvents, keyEvents);
      };

      var me = {
        schema: schema,
        processKey: processKey,
        toEvents: toEvents,
        toApis: getApis
      };

      return me;
    };

    return {
      typical: typical
    };
  }
);