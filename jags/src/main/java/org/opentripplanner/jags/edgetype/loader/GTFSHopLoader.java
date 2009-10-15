package org.opentripplanner.jags.edgetype.loader;

import java.util.ArrayList;

import org.opentripplanner.jags.core.Graph;
import org.opentripplanner.jags.core.SpatialVertex;
import org.opentripplanner.jags.core.Vertex;
import org.opentripplanner.jags.edgetype.DrawHandler;
import org.opentripplanner.jags.edgetype.Hop;
import org.opentripplanner.jags.edgetype.factory.GTFSHopFactory;
import org.opentripplanner.jags.gtfs.Feed;
import org.opentripplanner.jags.gtfs.Stop;

public class GTFSHopLoader {
	Graph graph;
	Feed feed;
	
	public GTFSHopLoader( Graph graph, Feed feed ) {
		this.graph = graph;
		this.feed = feed;
	}
	
	public void load(DrawHandler drawHandler, boolean verbose) throws Exception {
		//Load stops
		if(verbose){ System.out.println( "Loading stops" ); }
		feed.loadStops();
		for( Stop stop : feed.getAllStops() ) {
			graph.addVertex( new SpatialVertex( stop.stop_id, stop.stop_lon, stop.stop_lat ) );
		}
		
		//Load routes
		feed.loadRoutes();
		
		//Load hops
		if(verbose){ System.out.println( "Loading hops" ); }
		GTFSHopFactory hf = new GTFSHopFactory(feed);
		ArrayList<Hop> hops = hf.run(verbose);
		for( Hop hop : hops ) {
			if(drawHandler != null){ drawHandler.handle(hop); }
			Vertex start = graph.addVertex(hop.start.stop_id);
			start.isTransitStop = true;
			Vertex end = graph.addVertex(hop.end.stop_id);
			end.isTransitStop = true;
			graph.addEdge(start, end, hop);
		}
	}
	
	public void load(DrawHandler drawHandler) throws Exception {
		load(drawHandler, false);
	}
	
	public void load() throws Exception {
		load(null);
	}
	
}