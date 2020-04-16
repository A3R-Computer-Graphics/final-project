import bpy
import json

C = bpy.context
D = bpy.data
MATERIAL_FPATH = 'D:\\kuliah\\Grafkom\\a3r\\ws-2\\temp\\objects-materials.js'
default_material = {
      "name": "Default",
      "ambient": [1.0, 0.0, 1.0, 1.0],
      "diffuse": [1.0, 0.8, 0.0, 1.0],
      "specular": [1.0, 0.8, 0.0, 1.0],
      "shininess": 20,
    }


materials = [default_material]

for material in D.materials:
    material_data = {}
    material_data['name'] = material.name
    
    if 'Principled BSDF' not in material.node_tree.nodes:
        continue
    
    node = material.node_tree.nodes['Principled BSDF']
    color_values = node.inputs['Base Color'].default_value
    
    material_color = [color_values[0], color_values[1], color_values[2], color_values[3]]
    # shininess = node.inputs['Specular'].default_value * 128
    
    material_data['ambient'] = material_color
    material_data['diffuse'] = material_color
    material_data['specular'] = material_color
    material_data['shininess'] = 20
    
    materials.append(material_data)
    

with open(MATERIAL_FPATH, "w+") as outfile:
    outfile.write("var materials_definition = " + json.dumps(materials))