import { graphql } from "react-relay";

import r from "../resolve";

export default r(graphql`
  mutation setGroupSliceMutation(
    $subscription: String!
    $session: String
    $view: BSONArray!
    $slice: String!
  ) {
    setGroupSlice(
      subscription: $subscription
      session: $session
      view: $view
      slice: $slice
    ) {
      id
    }
  }
`);
