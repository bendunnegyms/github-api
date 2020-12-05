from graphviz import Digraph

dot = Digraph()
dot.node('A', 'A')
dot.node('B', 'B')
dot.node('C', 'C')
dot.edges(['AB', 'AB', 'AB', 'BC', 'BA', 'CB'])

print(dot.source)
dot.render("test_graph", view=True)