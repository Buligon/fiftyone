import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Mesh, MeshStandardMaterial, Quaternion, Vector3 } from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { ObjAsset } from "../../hooks";
import { useMeshMaterialControls } from "../../hooks/use-mesh-material-controls";
import { getColorFromPoolBasedOnHash } from "../../utils";
import { getBasePathForTextures } from "../utils";

const ObjMeshDefaultMaterial = ({
  name,
  obj,
  onLoad,
}: {
  name: string;
  obj: ObjAsset;
  onLoad?: () => void;
}) => {
  const { objUrl } = obj;
  const mesh = useLoader(OBJLoader, objUrl);

  const { material } = useMeshMaterialControls(name, obj.defaultMaterial);

  useEffect(() => {
    if (!mesh) {
      return;
    }

    mesh.traverse((child) => {
      if (child instanceof Mesh) {
        try {
          child.material = material;
        } catch {
          child.material = new MeshStandardMaterial({
            color: getColorFromPoolBasedOnHash(objUrl),
          });
        }
      }
    });

    onLoad?.();
  }, [mesh, objUrl, material, onLoad]);

  return <primitive object={mesh} />;
};

const ObjMeshWithCustomMaterial = ({
  obj,
  onLoad,
}: {
  name: string;
  obj: ObjAsset;
  onLoad?: () => void;
}) => {
  const { objUrl, mtlUrl } = obj;

  const resourcePath = useMemo(
    () => (mtlUrl ? getBasePathForTextures(mtlUrl, ["mtl"]) : null),
    [mtlUrl]
  );

  const materials = useLoader(MTLLoader, mtlUrl, (loader) => {
    if (resourcePath) {
      loader.setResourcePath(resourcePath);
    }
  });
  const mesh = useLoader(OBJLoader, objUrl, (loader) => {
    if (mtlUrl) {
      materials.preload();
      loader.setMaterials(materials);
    }
  });

  useEffect(() => {
    if (mesh) {
      onLoad?.();
    }
  }, [mesh, onLoad]);

  return <primitive object={mesh} />;
};

export const Obj = ({
  name,
  obj,
  position,
  quaternion,
  scale,
  children,
}: {
  name: string;
  obj: ObjAsset;
  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
  children?: React.ReactNode;
}) => {
  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      {obj.mtlUrl ? (
        <ObjMeshWithCustomMaterial name={name} obj={obj} />
      ) : (
        <ObjMeshDefaultMaterial name={name} obj={obj} />
      )}
      {children ?? null}
    </group>
  );
};
