import { Arr, Future } from '@ephox/katamari';

import * as SketchBehaviours from '../../api/component/SketchBehaviours';
import { ToolbarGroup } from '../../api/ui/ToolbarGroup';
import { CompositeSketchFactory } from '../../api/ui/UiSketcher';
import * as Layout from '../../positioning/layout/Layout';
import * as SplitToolbarUtils from '../../toolbar/SplitToolbarUtils';
import * as SplitFloatingToolbarSchema from '../../ui/schema/SplitFloatingToolbarSchema';
import { SplitFloatingToolbarApis, SplitFloatingToolbarDetail, SplitFloatingToolbarSketcher, SplitFloatingToolbarSpec } from '../../ui/types/SplitFloatingToolbarTypes';
import { Coupling } from '../behaviour/Coupling';
import { AlloyComponent } from '../component/ComponentApi';
import * as GuiFactory from '../component/GuiFactory';
import * as Memento from '../component/Memento';
import { AlloySpec } from '../component/SpecTypes';
import { FloatingToolbarButton } from './FloatingToolbarButton';
import * as Sketcher from './Sketcher';

const buildGroups = (comps: AlloyComponent[]): AlloySpec[] => Arr.map(comps, (g) => GuiFactory.premade(g));

const refresh = (toolbar: AlloyComponent, memFloatingToolbarButton: Memento.MementoRecord, detail: SplitFloatingToolbarDetail) => {
  SplitToolbarUtils.refresh(toolbar, detail, (overflowGroups) => {
    detail.overflowGroups.set(overflowGroups);

    memFloatingToolbarButton.getOpt(toolbar).each((floatingToolbarButton) => {
      FloatingToolbarButton.setGroups(floatingToolbarButton, buildGroups(overflowGroups));
    });
  });
};

const factory: CompositeSketchFactory<SplitFloatingToolbarDetail, SplitFloatingToolbarSpec> = (detail, components, spec, externals) => {
  const memFloatingToolbarButton = Memento.record(
    FloatingToolbarButton.sketch({
      fetch: () => Future.nu((resolve) => {
        resolve(buildGroups(detail.overflowGroups.get()));
      }),
      layouts: {
        onLtr: () => [ Layout.southwest ],
        onRtl: () => [ Layout.southeast ],
        onBottomLtr: () => [ Layout.northwest ],
        onBottomRtl: () => [ Layout.northeast ]
      },
      getBounds: spec.getOverflowBounds,
      lazySink: detail.lazySink,
      fireDismissalEventInstead: {},
      markers: {
        toggledClass: detail.markers.overflowToggledClass
      },
      parts: {
        button: externals['overflow-button'](),
        toolbar: externals.overflow(),
      }
    })
  );

  return {
    uid: detail.uid,
    dom: detail.dom,
    components,
    behaviours: SketchBehaviours.augment(
      detail.splitToolbarBehaviours,
      [
        Coupling.config({
          others: {
            overflowGroup() {
              return ToolbarGroup.sketch({
                ...externals['overflow-group'](),
                items: [
                  memFloatingToolbarButton.asSpec()
                ]
              });
            }
          }
        }),
      ]
    ),
    apis: {
      setGroups(toolbar: AlloyComponent, groups: AlloySpec[]) {
        detail.builtGroups.set(Arr.map(groups, toolbar.getSystem().build));
        refresh(toolbar, memFloatingToolbarButton, detail);
      },
      refresh: (toolbar: AlloyComponent) => refresh(toolbar, memFloatingToolbarButton, detail),
      toggle: (toolbar: AlloyComponent) => {
        memFloatingToolbarButton.getOpt(toolbar).each((floatingToolbarButton) => {
          FloatingToolbarButton.toggle(floatingToolbarButton);
        });
      },
      reposition: (toolbar: AlloyComponent) => {
        memFloatingToolbarButton.getOpt(toolbar).each((floatingToolbarButton) => {
          FloatingToolbarButton.reposition(floatingToolbarButton);
        });
      },
      getOverflow: (toolbar: AlloyComponent) => memFloatingToolbarButton.getOpt(toolbar).bind((floatingToolbarButton) => FloatingToolbarButton.getToolbar(floatingToolbarButton))
    },

    domModification: {
      attributes: { role: 'group' }
    }
  };
};

const SplitFloatingToolbar: SplitFloatingToolbarSketcher = Sketcher.composite<SplitFloatingToolbarSpec, SplitFloatingToolbarDetail, SplitFloatingToolbarApis>({
  name: 'SplitFloatingToolbar',
  configFields: SplitFloatingToolbarSchema.schema(),
  partFields: SplitFloatingToolbarSchema.parts(),
  factory,
  apis: {
    setGroups: (apis, toolbar, groups) => {
      apis.setGroups(toolbar, groups);
    },
    refresh: (apis, toolbar) => {
      apis.refresh(toolbar);
    },
    reposition: (apis, toolbar) => {
      apis.reposition(toolbar);
    },
    toggle: (apis, toolbar) => {
      apis.toggle(toolbar);
    },
    getOverflow: (apis, toolbar) => apis.getOverflow(toolbar)
  }
});

export { SplitFloatingToolbar };
