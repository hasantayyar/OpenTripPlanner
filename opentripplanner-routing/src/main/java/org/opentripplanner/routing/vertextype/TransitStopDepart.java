package org.opentripplanner.routing.vertextype;

import org.onebusaway.gtfs.model.Stop;
import org.opentripplanner.gtfs.GtfsLibrary;
import org.opentripplanner.routing.graph.Graph;

/* Note that this is not a subclass of TransitStop, to avoid it being linked to the street network */
public class TransitStopDepart extends OffboardVertex {

    private static final long serialVersionUID = 5353034364687763358L;

    public TransitStopDepart(Graph graph, Stop stop) {
        super(graph, GtfsLibrary.convertIdToString(stop.getId()) + "_depart", stop);
    }

}
