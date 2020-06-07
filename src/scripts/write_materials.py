import bpy
import json
import os
import shutil

C = bpy.context
D = bpy.data


DIR = os.path.join(bpy.path.abspath("//"), "../kode/src/resources/objects/")
DIR = os.path.normpath(DIR)

MATERIALS_DATA_PATH = os.path.join(DIR, 'objects-materials-simple.js')
IMAGE_COLLECT_DIR_PATH = os.path.join(DIR, 'material_resources')

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
    color_socket = node.inputs['Base Color']
    color_values = color_socket.default_value
    
    material_color = [color_values[0], color_values[1], color_values[2], color_values[3]]
    # shininess = node.inputs['Specular'].default_value * 128
    
    material_data['ambient'] = material_color
    material_data['diffuse'] = material_color
    material_data['specular'] = material_color
    material_data['shininess'] = 20
    
    # Find color socket that's connected to this BSDF node
    # Then, accept only image shader
    color_links = color_socket.links
    image_node = None
    
    for link in color_socket.links:
        if link.to_node == node:
            from_node = link.from_node
            if isinstance(from_node, bpy.types.ShaderNodeTexImage):
                image_node = from_node
                break
    
    if image_node is not None and image_node.image is not None:
        image = image_node.image
        image_path = os.path.normpath(image_node.image.filepath_from_user())
        
        # Assume filenames are unique
        fname = os.path.split(image_path)[1]
        target_path = os.path.join(IMAGE_COLLECT_DIR_PATH, fname)
        
        if image_path != target_path:
            shutil.copy(image_path, target_path)
        
        material_data['image'] = fname
    
    materials.append(material_data)
    

with open(MATERIALS_DATA_PATH, "w+") as outfile:
    outfile.write("materials_definition = materials_definition.concat(" + json.dumps(materials, indent=2) + ")")
