/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Square Footage Calculation Utilities
 * 
 * Provides accurate area calculations for different room types and project scenarios.
 * Handles complex geometries, ceiling heights, and specialty calculations.
 */

export interface RoomDimensions {
    length: number;
    width: number;
    height?: number;
    ceilingHeight?: number;
}

export interface ComplexRoom {
    mainArea: RoomDimensions;
    alcoves?: RoomDimensions[];
    cutouts?: RoomDimensions[]; // Areas to subtract (like closets, built-ins)
    irregularShapes?: { vertices: { x: number; y: number }[] }[];
}

export interface ProjectMeasurements {
    floorArea: number;
    wallArea: number;
    ceilingArea: number;
    perimeterLength: number;
    totalVolume: number;
    paintableWallArea: number; // Walls minus doors/windows
    notes: string[];
}

/**
 * Calculate basic rectangular room area
 */
export const calculateRectangularArea = (length: number, width: number): number => {
    if (length <= 0 || width <= 0) {
        throw new Error('Room dimensions must be positive numbers');
    }
    return length * width;
};

/**
 * Calculate wall area for painting/wallpaper
 */
export const calculateWallArea = (
    length: number, 
    width: number, 
    height: number,
    doors: number = 1,
    windows: number = 2,
    doorArea: number = 21, // Standard door is 7ft x 3ft = 21 sq ft
    windowArea: number = 15 // Average window is 3ft x 5ft = 15 sq ft
): number => {
    const perimeterLength = 2 * (length + width);
    const totalWallArea = perimeterLength * height;
    const openingsArea = (doors * doorArea) + (windows * windowArea);
    
    return Math.max(0, totalWallArea - openingsArea);
};

/**
 * Calculate complex room with alcoves and cutouts
 */
export const calculateComplexRoomArea = (room: ComplexRoom): ProjectMeasurements => {
    const { mainArea, alcoves = [], cutouts = [], irregularShapes = [] } = room;
    const height = mainArea.height || mainArea.ceilingHeight || 8;
    
    // Start with main area
    let floorArea = calculateRectangularArea(mainArea.length, mainArea.width);
    let perimeterLength = 2 * (mainArea.length + mainArea.width);
    
    // Add alcoves
    alcoves.forEach(alcove => {
        floorArea += calculateRectangularArea(alcove.length, alcove.width);
        perimeterLength += 2 * (alcove.length + alcove.width);
    });
    
    // Subtract cutouts
    cutouts.forEach(cutout => {
        floorArea -= calculateRectangularArea(cutout.length, cutout.width);
        perimeterLength -= 2 * (cutout.length + cutout.width);
    });
    
    // Add irregular shapes using shoelace formula
    irregularShapes.forEach(shape => {
        const area = calculatePolygonArea(shape.vertices);
        floorArea += area;
        // Approximate perimeter for irregular shapes
        perimeterLength += estimatePolygonPerimeter(shape.vertices);
    });
    
    const wallArea = perimeterLength * height;
    const ceilingArea = floorArea;
    const totalVolume = floorArea * height;
    
    // Estimate paintable wall area (subtract typical openings)
    const estimatedDoors = Math.ceil(floorArea / 300); // 1 door per 300 sq ft
    const estimatedWindows = Math.ceil(floorArea / 150); // 1 window per 150 sq ft
    const paintableWallArea = calculateWallArea(
        mainArea.length, 
        mainArea.width, 
        height, 
        estimatedDoors, 
        estimatedWindows
    );
    
    const notes = [
        `Main area: ${mainArea.length}' x ${mainArea.width}'`,
        alcoves.length > 0 ? `Includes ${alcoves.length} alcove(s)` : '',
        cutouts.length > 0 ? `Excludes ${cutouts.length} cutout(s)` : '',
        irregularShapes.length > 0 ? `Includes ${irregularShapes.length} irregular shape(s)` : '',
        `Ceiling height: ${height}'`
    ].filter(note => note.length > 0);
    
    return {
        floorArea: Math.round(floorArea * 100) / 100,
        wallArea: Math.round(wallArea * 100) / 100,
        ceilingArea: Math.round(ceilingArea * 100) / 100,
        perimeterLength: Math.round(perimeterLength * 100) / 100,
        totalVolume: Math.round(totalVolume * 100) / 100,
        paintableWallArea: Math.round(paintableWallArea * 100) / 100,
        notes
    };
};

/**
 * Calculate polygon area using shoelace formula
 */
export const calculatePolygonArea = (vertices: { x: number; y: number }[]): number => {
    if (vertices.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        area += vertices[i].x * vertices[j].y;
        area -= vertices[j].x * vertices[i].y;
    }
    return Math.abs(area) / 2;
};

/**
 * Estimate polygon perimeter
 */
export const estimatePolygonPerimeter = (vertices: { x: number; y: number }[]): number => {
    if (vertices.length < 2) return 0;
    
    let perimeter = 0;
    for (let i = 0; i < vertices.length; i++) {
        const j = (i + 1) % vertices.length;
        const dx = vertices[j].x - vertices[i].x;
        const dy = vertices[j].y - vertices[i].y;
        perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    return perimeter;
};

/**
 * Parse natural language descriptions to extract measurements
 */
export const parseRoomDescription = (description: string): RoomDimensions | null => {
    const desc = description.toLowerCase();
    
    // Look for patterns like "8 feet by 10 feet", "8x10", "8' x 10'", etc.
    const patterns = [
        /(\d+(?:\.\d+)?)\s*(?:feet|ft|')\s*(?:by|x)\s*(\d+(?:\.\d+)?)\s*(?:feet|ft|')/i,
        /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s*by\s*(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s*ft\s*x\s*(\d+(?:\.\d+)?)\s*ft/i
    ];
    
    for (const pattern of patterns) {
        const match = desc.match(pattern);
        if (match) {
            const length = parseFloat(match[1]);
            const width = parseFloat(match[2]);
            
            // Look for height/ceiling height
            const heightPattern = /(?:ceiling|height|tall).*?(\d+(?:\.\d+)?)\s*(?:feet|ft|')/i;
            const heightMatch = desc.match(heightPattern);
            const height = heightMatch ? parseFloat(heightMatch[1]) : undefined;
            
            return { length, width, height };
        }
    }
    
    // Look for square footage mentions
    const sqftPattern = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:square feet|sq\s*ft|sqft)/i;
    const sqftMatch = desc.match(sqftPattern);
    if (sqftMatch) {
        const sqft = parseFloat(sqftMatch[1].replace(/,/g, ''));
        // Assume square room for simplicity
        const side = Math.sqrt(sqft);
        return { length: side, width: side };
    }
    
    return null;
};

/**
 * Calculate specific project types with industry standards
 */
export const calculateProjectSpecificArea = (
    projectType: string,
    measurements: ProjectMeasurements
): Record<string, number> => {
    const { floorArea, wallArea, ceilingArea, paintableWallArea } = measurements;
    
    switch (projectType.toLowerCase()) {
        case 'flooring':
        case 'hardwood':
        case 'tile':
        case 'carpet':
            return {
                primaryArea: floorArea,
                wasteAllowance: floorArea * 0.1, // 10% waste
                totalMaterial: floorArea * 1.1
            };
            
        case 'painting':
        case 'paint':
            return {
                primaryArea: paintableWallArea + ceilingArea,
                primer: (paintableWallArea + ceilingArea) * 1.05, // 5% extra for primer
                finish: (paintableWallArea + ceilingArea) * 1.15 // 15% extra for finish coats
            };
            
        case 'drywall':
        case 'sheetrock':
            return {
                primaryArea: wallArea + ceilingArea,
                materialWaste: (wallArea + ceilingArea) * 0.15, // 15% waste for drywall
                jointCompound: (wallArea + ceilingArea) * 0.05, // Estimate for joint compound
                totalMaterial: (wallArea + ceilingArea) * 1.15
            };
            
        case 'roofing':
        case 'roof':
            // Assume roof area is floor area + 30% for pitch and overhangs
            const roofArea = floorArea * 1.3;
            return {
                primaryArea: roofArea,
                underlayment: roofArea * 1.1,
                shingles: roofArea * 1.15, // Account for ridge caps and waste
                totalMaterial: roofArea * 1.15
            };
            
        case 'siding':
            return {
                primaryArea: paintableWallArea,
                material: paintableWallArea * 1.2, // 20% waste for siding
                trim: measurements.perimeterLength * 1.1 // Perimeter for trim
            };
            
        default:
            return {
                primaryArea: floorArea,
                totalMaterial: floorArea * 1.1
            };
    }
};

/**
 * Generate detailed measurement report
 */
export const generateMeasurementReport = (
    measurements: ProjectMeasurements,
    projectType: string
): string => {
    const specificAreas = calculateProjectSpecificArea(projectType, measurements);
    
    let report = `**Measurement Summary for ${projectType}:**\n\n`;
    report += `• Floor Area: ${measurements.floorArea} sq ft\n`;
    report += `• Wall Area: ${measurements.wallArea} sq ft\n`;
    report += `• Ceiling Area: ${measurements.ceilingArea} sq ft\n`;
    report += `• Paintable Wall Area: ${measurements.paintableWallArea} sq ft\n`;
    report += `• Perimeter: ${measurements.perimeterLength} linear ft\n`;
    report += `• Volume: ${measurements.totalVolume} cubic ft\n\n`;
    
    report += `**Project-Specific Calculations:**\n`;
    Object.entries(specificAreas).forEach(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        report += `• ${formattedKey}: ${Math.round(value * 100) / 100} sq ft\n`;
    });
    
    if (measurements.notes.length > 0) {
        report += `\n**Notes:**\n`;
        measurements.notes.forEach(note => report += `• ${note}\n`);
    }
    
    return report;
};

/**
 * Validate measurements for common errors
 */
export const validateMeasurements = (measurements: ProjectMeasurements): string[] => {
    const warnings: string[] = [];
    
    if (measurements.floorArea < 10) {
        warnings.push('Floor area seems very small (< 10 sq ft). Please verify dimensions.');
    }
    
    if (measurements.floorArea > 10000) {
        warnings.push('Floor area seems very large (> 10,000 sq ft). Please verify dimensions.');
    }
    
    if (measurements.wallArea / measurements.floorArea > 8) {
        warnings.push('Wall area ratio seems high. Check ceiling height or room shape.');
    }
    
    if (measurements.perimeterLength / Math.sqrt(measurements.floorArea) > 6) {
        warnings.push('Perimeter ratio suggests very irregular shape. Verify measurements.');
    }
    
    return warnings;
};

export default {
    calculateRectangularArea,
    calculateWallArea,
    calculateComplexRoomArea,
    calculatePolygonArea,
    parseRoomDescription,
    calculateProjectSpecificArea,
    generateMeasurementReport,
    validateMeasurements
};