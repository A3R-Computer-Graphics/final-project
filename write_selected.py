# A handy script for extracting quads/tris made in blender
# into values that can be copied to javascript

import json

OBJECTS_VERTEX_FPATH = 'D:\\kuliah\\Grafkom\\a3r\\ws-2\\temp\\objects-vertices.js'
OBJECTS_INFO_PATH = 'D:\\kuliah\\Grafkom\\a3r\\ws-2\\temp\\objects-data.js'

def write_selected():
    # C = Convenience variables for bpy.context
    objs = C.selected_objects
    objs_verts_data = {}
    objs_info_data = {}
#
    for obj in objs:
        obj_verts = {}
#
        # Write all quads and tris
        quad_vertices = []
        tris_vertices = []
        for f in obj.data.polygons:
            vertices = []
            for idx in f.vertices:
                vertices.append(list(obj.data.vertices[idx].co[0:3]))
            if len(vertices) == 4:
                quad_vertices.append(vertices)
            elif len(vertices) == 3:
                tris_vertices.append(vertices)
#
        obj_verts["quads"] = quad_vertices
        obj_verts["tris"] = tris_vertices
#
        # Print object loc rot scale
        obj_info = {}
        loc = obj.location
        rot = obj.rotation_euler
        scale = obj.scale
        obj_info["location"] = [loc[0], loc[1], loc[2]]
        obj_info["rotation"] = [rot[0], rot[1], rot[2]]
        obj_info["scale"] = [scale[0], scale[1], scale[2]]
        # Write material data name, if any
        obj_materials = obj.material_slots.keys()
        if len(obj_materials) > 0:
            obj_info["material_name"] =  obj_materials[0]
#
        # If parent exists, make location relative to parent.
        # NOTE: This only works if all rotation and scale are 1.
        # Which makes the obj_info rotation and scale not usable.
        #
        # A better solution would be to write the inverse matrix transf of parent
        # at parent initialization.
        # But I don't think for this WS it would be necessary to compute that.
        if obj.parent:
            parent = obj.parent
            for i in range(3):
                obj_info["location"][i] -= parent.location[i]
            obj_info["parent"] = parent.name
#
        objs_info_data[obj.name] = obj_info
        objs_verts_data[obj.name] = obj_verts
#
    with open(OBJECTS_INFO_PATH, "w+") as outfile:
        outfile.write("var objects_info = " + json.dumps(objs_info_data))
    with open(OBJECTS_VERTEX_FPATH, "w+") as outfile:
        outfile.write("var objects_vertices = " + json.dumps(objs_verts_data))