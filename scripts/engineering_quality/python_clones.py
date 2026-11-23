"""Python body clones include renamed parameters and local bindings."""
import ast
import copy

class CanonicalBindings(ast.NodeTransformer):
    def __init__(self, function):
        args = function.args
        self.names = {}
        for arg in args.posonlyargs + args.args + args.kwonlyargs:
            self.names.setdefault(arg.arg, 'arg_' + str(len(self.names)))
        for arg in (args.vararg, args.kwarg):
            if arg:
                self.names.setdefault(arg.arg, 'arg_' + str(len(self.names)))
        for node in ast.walk(function):
            if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                self.names.setdefault(node.id, 'local_' + str(len(self.names)))

    def visit_Name(self, node):
        return ast.copy_location(ast.Name(id=self.names.get(node.id, node.id), ctx=node.ctx), node)

def validate(root, paths, errors, affected=None, findings=None):
    seen = {}
    reported = set()
    for path in paths:
        if path.suffix != '.py':
            continue
        try:
            tree = ast.parse(path.read_text())
        except (SyntaxError, UnicodeError, OSError):
            continue
        for function in ast.walk(tree):
            if not isinstance(function, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            body = list(function.body)
            if body and isinstance(body[0], ast.Expr) and isinstance(body[0].value, ast.Constant) and isinstance(body[0].value.value, str):
                body = body[1:]
            if sum(1 for statement in body for _ in ast.walk(statement)) < 20:
                continue
            transformer = CanonicalBindings(function)
            canonical = [transformer.visit(copy.deepcopy(statement)) for statement in body]
            signature = tuple(ast.dump(statement, include_attributes=False) for statement in canonical)
            current = (path.relative_to(root).as_posix(), function.lineno, function.name)
            previous = seen.get(signature)
            if previous:
                pair = (previous, current)
                if pair not in reported:
                    message = f'duplicate Python function body: {previous} and {current}; reuse one canonical function'
                    locations = [previous[0],current[0]]
                    if findings is not None:findings.append({'paths':locations,'message':message})
                    if affected is None or set(locations) & affected:errors.append(message)
                    reported.add(pair)
            else:
                seen[signature] = current
