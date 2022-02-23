"""
FiftyOne Server /values route

| Copyright 2017-2022, Voxel51, Inc.
| `voxel51.com <https://voxel51.com/>`_
|
"""
from starlette.endpoints import HTTPEndpoint
from starlette.requests import Request

import fiftyone.core.aggregations as foa
from fiftyone.core.expressions import ViewField as F, _escape_regex_chars
import fiftyone.core.media as fom

import fiftyone.server.constants as foc
from fiftyone.server.decorators import route
import fiftyone.server.view as fosv


class Values(HTTPEndpoint):
    @route
    async def post(self, request: Request, data: dict):
        dataset = data.get("dataset")
        path = data.get("path")
        selected = data.get("selected")
        search = data.get("search")
        asc = data.get("asc", True)
        count = data.get("count")
        limit = data.get("limit", foc.LIST_LIMIT)
        sample_id = data.get("sample_id", None)
        stages = data.get("view", [])

        view = fosv.get_view(dataset, stages)
        view = _get_search_view(view, path, search, selected)

        if sample_id is not None:
            view = view.select(sample_id)

        sort_by = "count" if count else "_id"

        count, first = await view._async_aggregate(
            foa.CountValues(path, _first=limit, _asc=asc, _sort_by=sort_by)
        )

        return {
            "count": count,
            "values": map(lambda v: {"value": v[0], "count": v[1]}, first),
        }


def _get_search_view(view, path, search, selected):
    search = _escape_regex_chars(search)

    fields_map = view._get_db_fields_map()
    if search == "" and not selected:
        return view

    if "." in path:
        fields = path.split(".")
        if view.media_type == fom.VIDEO and fields[0] == "frames":
            field = ".".join(fields[:2])
        else:
            field = fields[0]

        vf = F("label")
        meth = lambda expr: view.filter_labels(field, expr)
    else:
        vf = fosv.get_view_field(fields_map, path)
        meth = view.match

    if search != "" and selected:
        expr = vf.re_match(search) & ~vf.is_in(selected)
    elif search != "":
        expr = vf.re_match(search)
    elif selected:
        expr = ~vf.is_in(selected)

    return meth(expr)
