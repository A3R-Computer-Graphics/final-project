import bpy
import json
import math
import os

DIR = os.path.dirname(os.path.abspath(__file__))

rad_to_deg = 180 / math.pi

C = bpy.context
D = bpy.data
ANIMATION_FPATH = os.join.path(DIR, '../src/resources/objects/objects-animations.js')

objs_animation_data = {}
objs = C.selected_objects

passable_properties = ["delta_location", "delta_rotation_euler", "delta_scale"]

for obj in objs:
    animation_data = obj.animation_data
    obj_name = obj.name
    
    if animation_data is None or \
        animation_data.action is None:
        continue
    
    fcurves = animation_data.action.fcurves
    
    for fcurve in fcurves:
        property_name = fcurve.data_path
        
        if property_name not in passable_properties:
            continue
        
        axis_id = fcurve.array_index
        axis_name = chr(ord('x') + fcurve.array_index)
        
        # Remove "delta_" token from property_name
        original_property = property_name.replace("delta_", "")
        
        # Write all keyframe
        keyframes = fcurve.keyframe_points
        keyframe_strings = []
        
        if "rotation" in original_property:
            rotation_multiplier = rad_to_deg
        else:
            rotation_multiplier = 1
        
        # Since we're animating a delta property, we need to add
        # the final value with initial value
        initial_value = getattr(obj, original_property)[axis_id]
        
        # For position, we need to subtract object's position with
        # parent position.
        
        if "location" in original_property:
            parent = obj.parent
            if parent:
                initial_value -= parent.location[axis_id]
        
        for keyframe in keyframes:
            framenum = int(keyframe.co[0])
            value = keyframe.co[1]
            if "scale" in original_property:
                value = value * initial_value
            else:
                value = (value + initial_value) * rotation_multiplier
            value = round(value, 2)
            keyframe_strings.append(str(framenum) + "F " + str(value))
        
        keyframes_as_string = " ".join(keyframe_strings)
        # Ignore empty keyframes
        if len(keyframes_as_string) == 0:
            continue
        
        # Convert "rotation_euler" into "rotation"
        if original_property == "rotation_euler":
            original_property = "rotation"
        if original_property == "location":
            original_property = "position"
        
        written_anim_name = obj_name + "." + original_property + "." + axis_name

        objs_animation_data[written_anim_name] = keyframes_as_string

with open(ANIMATION_FPATH, "w+") as outfile:
    outfile.write("var animations_definition = " + json.dumps(objs_animation_data))