from langgraph.graph import StateGraph, START, END

from agent.state import SafeRouteState
from agent.nodes import analyze_trip, select_route, explain_route


builder = StateGraph(SafeRouteState)

builder.add_node("analyze_trip", analyze_trip)
builder.add_node("select_route", select_route)
builder.add_node("explain_route", explain_route)

builder.add_edge(START, "analyze_trip")
builder.add_edge("analyze_trip", "select_route")
builder.add_edge("select_route", "explain_route")
builder.add_edge("explain_route", END)

graph = builder.compile()