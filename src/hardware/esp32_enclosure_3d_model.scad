/*
 * SafeEdge ESP32 Professional Enclosure
 * Task 7.1: 3D model for professional ESP32 enclosures with SafeEdge branding
 * 
 * Features:
 * - Hospital-grade white ABS plastic design
 * - Professional SafeEdge branding with logo
 * - LED indicator windows for status display
 * - Sensor integration points
 * - Wall-mount compatibility
 * - Cable management and strain relief
 * 
 * Dimensions: 120mm x 80mm x 40mm
 * Material: White ABS plastic (medical grade)
 * Mounting: Standard hospital wall-mount brackets
 * 
 * Print Settings:
 * - Layer Height: 0.2mm
 * - Infill: 20%
 * - Support: Yes (for overhangs)
 * - Print Speed: 50mm/s
 * - Nozzle Temperature: 230°C (ABS)
 * - Bed Temperature: 100°C
 */

// Global parameters
$fn = 50; // Smooth curves

// Enclosure dimensions
enclosure_width = 120;
enclosure_depth = 80;
enclosure_height = 40;
wall_thickness = 2.5;

// ESP32 dimensions
esp32_width = 55;
esp32_depth = 28;
esp32_height = 13;

// LED positions
led_diameter = 5;
led_spacing = 15;

// Mounting holes
mount_hole_diameter = 4;
mount_hole_spacing = 100;

// Cable entry
cable_entry_diameter = 8;

// Logo dimensions
logo_width = 40;
logo_height = 12;
logo_depth = 0.5;

module main_enclosure() {
    difference() {
        // Outer shell
        rounded_box(enclosure_width, enclosure_depth, enclosure_height, 3);
        
        // Inner cavity
        translate([wall_thickness, wall_thickness, wall_thickness]) {
            rounded_box(
                enclosure_width - 2*wall_thickness, 
                enclosure_depth - 2*wall_thickness, 
                enclosure_height - wall_thickness, 
                2
            );
        }
        
        // LED indicator holes
        translate([enclosure_width/2, enclosure_depth - 10, enclosure_height]) {
            // Green LED (Safe)
            translate([-led_spacing, 0, -wall_thickness]) {
                cylinder(d=led_diameter, h=wall_thickness*2);
                // LED label
                translate([0, -8, -0.5]) {
                    linear_extrude(1) {
                        text("SAFE", size=3, halign="center", font="Arial:style=Bold");
                    }
                }
            }
            
            // Yellow LED (Warning)
            translate([0, 0, -wall_thickness]) {
                cylinder(d=led_diameter, h=wall_thickness*2);
                // LED label
                translate([0, -8, -0.5]) {
                    linear_extrude(1) {
                        text("WARN", size=3, halign="center", font="Arial:style=Bold");
                    }
                }
            }
            
            // Red LED (Critical)
            translate([led_spacing, 0, -wall_thickness]) {
                cylinder(d=led_diameter, h=wall_thickness*2);
                // LED label
                translate([0, -8, -0.5]) {
                    linear_extrude(1) {
                        text("CRIT", size=3, halign="center", font="Arial:style=Bold");
                    }
                }
            }
        }
        
        // Attack simulation LED (center, larger)
        translate([enclosure_width/2, enclosure_depth/2 + 10, enclosure_height]) {
            cylinder(d=led_diameter + 2, h=wall_thickness*2);
            // Attack LED label
            translate([0, -12, -0.5]) {
                linear_extrude(1) {
                    text("ATTACK", size=3, halign="center", font="Arial:style=Bold");
                }
            }
        }
        
        // Sensor windows
        // DHT22 ventilation grille
        translate([10, 10, enclosure_height]) {
            for(i = [0:4]) {
                for(j = [0:2]) {
                    translate([i*3, j*3, -wall_thickness]) {
                        cylinder(d=1.5, h=wall_thickness*2);
                    }
                }
            }
        }
        
        // PIR sensor window
        translate([enclosure_width - 15, 15, enclosure_height]) {
            cylinder(d=12, h=wall_thickness*2);
        }
        
        // Microphone grille
        translate([enclosure_width - 20, enclosure_depth - 20, enclosure_height]) {
            for(i = [0:3]) {
                for(j = [0:3]) {
                    translate([i*2, j*2, -wall_thickness]) {
                        cylinder(d=1, h=wall_thickness*2);
                    }
                }
            }
        }
        
        // Cable entry (bottom)
        translate([enclosure_width/2, wall_thickness, enclosure_height/2]) {
            rotate([90, 0, 0]) {
                cylinder(d=cable_entry_diameter, h=wall_thickness*2);
            }
        }
        
        // Wall mounting holes
        translate([enclosure_width/2, enclosure_depth/2, 0]) {
            translate([-mount_hole_spacing/2, 0, -1]) {
                cylinder(d=mount_hole_diameter, h=wall_thickness*2);
            }
            translate([mount_hole_spacing/2, 0, -1]) {
                cylinder(d=mount_hole_diameter, h=wall_thickness*2);
            }
        }
        
        // Ventilation slots (sides)
        for(i = [0:4]) {
            translate([0, 20 + i*8, enclosure_height/2]) {
                rotate([0, 90, 0]) {
                    rounded_slot(15, 2, wall_thickness*2);
                }
            }
            translate([enclosure_width, 20 + i*8, enclosure_height/2]) {
                rotate([0, -90, 0]) {
                    rounded_slot(15, 2, wall_thickness*2);
                }
            }
        }
    }
    
    // SafeEdge logo (raised)
    translate([enclosure_width/2, enclosure_depth/2 - 15, enclosure_height]) {
        safeedge_logo();
    }
    
    // Device ID label area
    translate([enclosure_width/2, 15, enclosure_height]) {
        linear_extrude(0.3) {
            text("NICU-001", size=4, halign="center", font="Arial:style=Bold");
        }
    }
    
    // Status label area
    translate([enclosure_width/2, 8, enclosure_height]) {
        linear_extrude(0.3) {
            text("PROTECTED", size=3, halign="center", font="Arial");
        }
    }
}

module esp32_mounting_posts() {
    // ESP32 mounting posts
    translate([wall_thickness + 5, wall_thickness + 5, wall_thickness]) {
        cylinder(d=6, h=8);
        cylinder(d=2, h=12);
    }
    
    translate([wall_thickness + esp32_width + 5, wall_thickness + 5, wall_thickness]) {
        cylinder(d=6, h=8);
        cylinder(d=2, h=12);
    }
    
    translate([wall_thickness + 5, wall_thickness + esp32_depth + 5, wall_thickness]) {
        cylinder(d=6, h=8);
        cylinder(d=2, h=12);
    }
    
    translate([wall_thickness + esp32_width + 5, wall_thickness + esp32_depth + 5, wall_thickness]) {
        cylinder(d=6, h=8);
        cylinder(d=2, h=12);
    }
}

module safeedge_logo() {
    // SafeEdge logo (simplified for 3D printing)
    linear_extrude(logo_depth) {
        // Shield shape
        polygon([
            [-logo_width/2, -logo_height/2],
            [-logo_width/3, logo_height/2],
            [0, logo_height/2 + 2],
            [logo_width/3, logo_height/2],
            [logo_width/2, -logo_height/2]
        ]);
    }
    
    // "SafeEdge" text
    translate([0, -logo_height/2 - 8, 0]) {
        linear_extrude(logo_depth) {
            text("SafeEdge", size=5, halign="center", font="Arial:style=Bold");
        }
    }
}

module rounded_box(width, depth, height, radius) {
    hull() {
        translate([radius, radius, 0]) {
            cylinder(r=radius, h=height);
        }
        translate([width-radius, radius, 0]) {
            cylinder(r=radius, h=height);
        }
        translate([radius, depth-radius, 0]) {
            cylinder(r=radius, h=height);
        }
        translate([width-radius, depth-radius, 0]) {
            cylinder(r=radius, h=height);
        }
    }
}

module rounded_slot(length, width, height) {
    hull() {
        translate([0, -length/2 + width/2, 0]) {
            cylinder(d=width, h=height);
        }
        translate([0, length/2 - width/2, 0]) {
            cylinder(d=width, h=height);
        }
    }
}

module wall_mount_bracket() {
    // Wall mounting bracket (separate piece)
    difference() {
        // Bracket base
        cube([mount_hole_spacing + 20, 15, 5]);
        
        // Mounting holes for wall
        translate([10, 7.5, -1]) {
            cylinder(d=6, h=7); // Wall screw hole
        }
        translate([mount_hole_spacing + 10, 7.5, -1]) {
            cylinder(d=6, h=7); // Wall screw hole
        }
        
        // Enclosure mounting holes
        translate([10 + mount_hole_spacing/2 - mount_hole_spacing/2, 7.5, -1]) {
            cylinder(d=mount_hole_diameter, h=7);
        }
        translate([10 + mount_hole_spacing/2 + mount_hole_spacing/2, 7.5, -1]) {
            cylinder(d=mount_hole_diameter, h=7);
        }
    }
    
    // Bracket arms
    translate([10, 15, 0]) {
        cube([5, 10, 5]);
    }
    translate([mount_hole_spacing + 5, 15, 0]) {
        cube([5, 10, 5]);
    }
}

module led_light_pipes() {
    // Light pipes to guide LED light to surface
    translate([enclosure_width/2 - led_spacing, enclosure_depth - 10, wall_thickness + 2]) {
        cylinder(d=led_diameter - 0.5, h=enclosure_height - wall_thickness - 4);
    }
    
    translate([enclosure_width/2, enclosure_depth - 10, wall_thickness + 2]) {
        cylinder(d=led_diameter - 0.5, h=enclosure_height - wall_thickness - 4);
    }
    
    translate([enclosure_width/2 + led_spacing, enclosure_depth - 10, wall_thickness + 2]) {
        cylinder(d=led_diameter - 0.5, h=enclosure_height - wall_thickness - 4);
    }
    
    // Attack LED light pipe
    translate([enclosure_width/2, enclosure_depth/2 + 10, wall_thickness + 2]) {
        cylinder(d=led_diameter + 1.5, h=enclosure_height - wall_thickness - 4);
    }
}

module cable_strain_relief() {
    // Cable strain relief insert
    translate([enclosure_width/2, 0, enclosure_height/2]) {
        rotate([90, 0, 0]) {
            difference() {
                cylinder(d=cable_entry_diameter + 4, h=8);
                cylinder(d=cable_entry_diameter, h=8);
                
                // Grip ridges
                for(i = [0:5]) {
                    translate([0, 0, i*1.2]) {
                        rotate_extrude() {
                            translate([cable_entry_diameter/2 + 1, 0, 0]) {
                                circle(d=0.8);
                            }
                        }
                    }
                }
            }
        }
    }
}

// Assembly
module complete_enclosure() {
    main_enclosure();
    esp32_mounting_posts();
    led_light_pipes();
}

// Render options
render_option = "complete"; // Options: "complete", "bracket", "strain_relief"

if (render_option == "complete") {
    complete_enclosure();
} else if (render_option == "bracket") {
    wall_mount_bracket();
} else if (render_option == "strain_relief") {
    cable_strain_relief();
}

// Print layout for manufacturing
module print_layout() {
    // Main enclosure
    complete_enclosure();
    
    // Wall bracket (separate)
    translate([enclosure_width + 20, 0, 0]) {
        wall_mount_bracket();
    }
    
    // Strain relief (separate)
    translate([enclosure_width + 20, 30, 0]) {
        cable_strain_relief();
    }
    
    // Print information
    translate([0, -20, 0]) {
        linear_extrude(0.2) {
            text("SafeEdge ESP32 Enclosure v2.1", size=4, font="Arial:style=Bold");
        }
    }
    
    translate([0, -30, 0]) {
        linear_extrude(0.2) {
            text("Material: White ABS | Layer: 0.2mm | Infill: 20%", size=3, font="Arial");
        }
    }
}