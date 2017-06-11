import { Injectable } from '@angular/core';
import { ModelUtil } from 'app/scripts/common';
import {
  SvgLoader,
  VectorDrawableLoader,
} from 'app/scripts/import';
import {
  Layer,
  LayerUtil,
  VectorLayer,
} from 'app/scripts/model/layers';
import {
  Animation,
  AnimationBlock,
} from 'app/scripts/model/timeline';
import {
  State,
  Store,
} from 'app/store';
import { getVectorLayer } from 'app/store/layers/selectors';
import * as _ from 'lodash';

/**
 * A simple service that imports vector layers from files.
 */
@Injectable()
export class FileImportService {
  private vectorLayer: VectorLayer;

  constructor(readonly store: Store<State>) {
    this.store.select(getVectorLayer).subscribe(vl => this.vectorLayer = vl);
  }

  import(
    fileList: FileList,
    successFn: (vls: VectorLayer[], animations?: ReadonlyArray<Animation>, hiddenLayerIds?: Set<string>) => void,
    failureFn: () => void,
  ) {
    if (!fileList || !fileList.length) {
      return;
    }

    const files: File[] = [];
    // tslint:disable-next-line
    for (let i = 0; i < fileList.length; i++) {
      files.push(fileList[i]);
    }

    let numCallbacks = 0;
    let numErrors = 0;
    const addedVls: VectorLayer[] = [];

    const maybeAddVectorLayersFn = () => {
      numCallbacks++;
      if (numErrors === files.length) {
        failureFn();
      } else if (numCallbacks === files.length) {
        successFn(addedVls);
      }
    };

    const existingVl = this.vectorLayer;
    for (const file of files) {
      const fileReader = new FileReader();

      fileReader.onload = event => {
        const text = (event.target as any).result;
        const callbackFn =
          vectorLayer => {
            if (!vectorLayer) {
              numErrors++;
              maybeAddVectorLayersFn();
              return;
            }
            addedVls.push(vectorLayer);
            maybeAddVectorLayersFn();
          };
        const doesNameExistFn =
          (name: string) => {
            return !!LayerUtil.findLayerByName([existingVl, ...addedVls], name);
          };
        if (file.type.includes('svg')) {
          SvgLoader.loadVectorLayerFromSvgStringWithCallback(text, callbackFn, doesNameExistFn);
        } else if (file.type.includes('xml')) {
          let vl: VectorLayer;
          try {
            vl = VectorDrawableLoader.loadVectorLayerFromXmlString(text, doesNameExistFn);
          } catch (e) {
            console.error('Failed to parse the file', e);
            callbackFn(undefined);
          }
          callbackFn(vl);
        } else if (file.type === 'application/json' || file.name.match(/\.shapeshifter$/)) {
          let vl: VectorLayer;
          let animations: ReadonlyArray<Animation>;
          let hiddenLayerIds: Set<string>;
          try {
            const jsonObj = JSON.parse(text);
            vl = new VectorLayer(jsonObj.vectorLayer);
            animations = jsonObj.animations.map(anim => new Animation(anim));
            hiddenLayerIds = new Set<string>(jsonObj.hiddenLayerIds);
            const regeneratedModels = ModelUtil.regenerateModelIds(vl, animations, hiddenLayerIds);
            vl = regeneratedModels.vectorLayer;
            animations = regeneratedModels.animations;
            hiddenLayerIds = regeneratedModels.hiddenLayerIds;
          } catch (e) {
            console.error('Failed to parse the file', e);
            failureFn();
          }
          successFn([vl], animations, hiddenLayerIds);
        }
      };

      fileReader.onerror = event => {
        const target = event.target as any;
        switch (target.error.code) {
          case target.error.NOT_FOUND_ERR:
            alert('File not found');
            break;
          case target.error.NOT_READABLE_ERR:
            alert('File is not readable');
            break;
          case target.error.ABORT_ERR:
            break;
          default:
            alert('An error occurred reading this file');
        }
        numErrors++;
        maybeAddVectorLayersFn();
      };

      fileReader.onabort = event => {
        alert('File read cancelled');
      };

      fileReader.readAsText(file);
    }
  }
}
