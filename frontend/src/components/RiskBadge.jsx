import React from 'react';
import { riskLevelClass } from '../utils/riskUtils';

export default function RiskBadge({ level }) {
  if (!level) return null;
  return <span className={riskLevelClass(level)}>{level}</span>;
}
