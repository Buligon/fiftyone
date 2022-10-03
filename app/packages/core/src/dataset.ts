import * as fos from "@fiftyone/state";
import { toCamelCase } from "@fiftyone/utilities";
import { useEffect, useState } from "react";
import { graphql, usePreloadedQuery, useQueryLoader } from "react-relay";

const datasetQueryNode = graphql`
  query datasetQuery($name: String!, $view: BSONArray = null) {
    dataset(name: $name, view: $view) {
      id
      name
      mediaType
      defaultGroupSlice
      groupField
      groupMediaTypes {
        name
        mediaType
      }
      appConfig {
        gridMediaField
        mediaFields
        plugins
      }
      sampleFields {
        ftype
        subfield
        embeddedDocType
        path
        dbField
      }
      frameFields {
        ftype
        subfield
        embeddedDocType
        path
        dbField
      }
      maskTargets {
        name
        targets {
          target
          value
        }
      }
      defaultMaskTargets {
        target
        value
      }
      evaluations {
        key
        version
        timestamp
        viewStages
        config {
          cls
          predField
          gtField
        }
      }
      brainMethods {
        key
        version
        timestamp
        viewStages
        config {
          cls
          embeddingsField
          method
          patchesField
        }
      }
      lastLoadedAt
      createdAt
      skeletons {
        name
        labels
        edges
      }
      defaultSkeleton {
        labels
        edges
      }
      version
      viewCls
      appConfig {
        mediaFields
        gridMediaField
        plugins
        sidebarGroups {
          name
          paths
        }
      }
    }
  }
`;

export function usePrepareDataset(
  dataset,
  { colorscale, config, state },
  setReady
) {
  const update = fos.useStateUpdate();

  useEffect(() => {
    if (dataset) {
      update(() => {
        return {
          colorscale,
          config: config
            ? (toCamelCase(config) as fos.State.Config)
            : undefined,
          dataset: fos.transformDataset(dataset),
          state,
        };
      });
      setReady(true);
    }
  }, [dataset]);
}
export function usePreLoadedDataset(
  queryRef,
  { colorscale, config, state } = {}
) {
  const [ready, setReady] = useState(false);
  const { dataset } = usePreloadedQuery(datasetQueryNode, queryRef);
  usePrepareDataset(dataset, { colorscale, config, state }, setReady);
  return [dataset, ready];
}
export function useDatasetLoader(environment) {
  const [queryRef, loadQuery] = useQueryLoader(datasetQueryNode);
  return [
    queryRef,
    (name) => {
      loadQuery({ name });
    },
  ];
}
