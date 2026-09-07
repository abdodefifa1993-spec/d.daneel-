import React from 'react';
import { LandmarkPoint } from '../../types';
import { DanielMapEngine } from './DanielMapEngine';

export interface RealGoogleMapsViewProps {
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

export const RealGoogleMapsView: React.FC<RealGoogleMapsViewProps> = (props) => {
  return <DanielMapEngine {...props} />;
};
