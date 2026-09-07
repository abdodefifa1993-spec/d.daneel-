import React from 'react';
import { LandmarkPoint } from '../../types';
import { DanielMapEngine } from './DanielMapEngine';

interface GoogleIraqiMapProps {
  interactiveSelection?: boolean;
  showSurgeHeatmap?: boolean;
  showFleetFleetAll?: boolean;
  showRadar?: boolean;
  showTraffic?: boolean;
  showTrail?: boolean;
  heightClass?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onLandmarkClick?: (landmark: LandmarkPoint) => void;
}

export const GoogleIraqiMap: React.FC<GoogleIraqiMapProps> = ({
  interactiveSelection = true,
  showSurgeHeatmap = true,
  showFleetFleetAll = true,
  showRadar = true,
  showTraffic = true,
  showTrail = true,
  heightClass = 'h-full',
  isFullScreen = false,
  onToggleFullScreen,
  onLandmarkClick
}) => {
  return (
    <DanielMapEngine
      interactiveSelection={interactiveSelection}
      showSurgeHeatmap={showSurgeHeatmap}
      showFleetFleetAll={showFleetFleetAll}
      showRadar={showRadar}
      showTraffic={showTraffic}
      showTrail={showTrail}
      heightClass={heightClass}
      isFullScreen={isFullScreen}
      onToggleFullScreen={onToggleFullScreen}
      onLandmarkClick={onLandmarkClick}
    />
  );
};
