import { Gesture } from 'app/scripts/paper/gesture';
import { HitTests } from 'app/scripts/paper/item';
import { Cursor, CursorUtil, PivotType } from 'app/scripts/paper/util';
import { PaperService } from 'app/services';
import * as paper from 'paper';

// prettier-ignore
const RESIZE_CURSOR_MAP: ReadonlyMap<PivotType, Cursor> = new Map([
  ['bottomLeft', Cursor.Resize45], ['leftCenter', Cursor.Resize90],
  ['topLeft', Cursor.Resize135], ['topCenter', Cursor.Resize0],
  ['topRight', Cursor.Resize45], ['rightCenter', Cursor.Resize90],
  ['bottomRight', Cursor.Resize135], ['bottomCenter', Cursor.Resize0],
] as [PivotType, Cursor][]);

// prettier-ignore
const ROTATE_CURSOR_MAP: ReadonlyMap<PivotType, Cursor> = new Map([
  ['bottomLeft', Cursor.Rotate225], ['leftCenter', Cursor.Rotate270],
  ['topLeft', Cursor.Rotate315], ['topCenter', Cursor.Rotate0],
  ['topRight', Cursor.Rotate45], ['rightCenter', Cursor.Rotate90],
  ['bottomRight', Cursor.Rotate135], ['bottomCenter', Cursor.Rotate180],
] as [PivotType, Cursor][]);

// prettier-ignore
const TRANSFORM_CURSOR_MAP: ReadonlyMap<PivotType, Cursor> = new Map([
  ['bottomLeft', Cursor.Resize45], ['leftCenter', Cursor.Resize0],
  ['topLeft', Cursor.Resize135], ['topCenter', Cursor.Resize90],
  ['topRight', Cursor.Resize45], ['rightCenter', Cursor.Resize0],
  ['bottomRight', Cursor.Resize135], ['bottomCenter', Cursor.Resize90],
] as [PivotType, Cursor][]);

/**
 * A gesture that performs hover operations on items.
 *
 * Preconditions:
 * - The user is in selection mode.
 */
export class HoverItemsGesture extends Gesture {
  constructor(private readonly ps: PaperService) {
    super();
  }

  // @Override
  onMouseMove(event: paper.ToolEvent) {
    CursorUtil.clear();

    const selectedLayers = this.ps.getSelectedLayerIds();
    if (selectedLayers.size) {
      const selectionBoundSegmentsHitResult = HitTests.selectionModeSegments(event.point);
      if (selectionBoundSegmentsHitResult) {
        // const toolMode = this.ps.getToolMode();
        const rii = this.ps.getRotateItemsInfo();
        const tpi = this.ps.getTransformPathsInfo();
        const cursorMap = rii ? ROTATE_CURSOR_MAP : tpi ? TRANSFORM_CURSOR_MAP : RESIZE_CURSOR_MAP;
        CursorUtil.set(cursorMap.get(selectionBoundSegmentsHitResult.item.pivotType));
        this.ps.setHoveredLayerId(undefined);
        return;
      }
    }

    const hitResult = HitTests.selectionMode(event.point, this.ps);
    if (hitResult && !selectedLayers.has(hitResult.hitItem.data.id)) {
      this.ps.setHoveredLayerId(hitResult.hitItem.data.id);
    } else {
      this.ps.setHoveredLayerId(undefined);
    }
  }
}
