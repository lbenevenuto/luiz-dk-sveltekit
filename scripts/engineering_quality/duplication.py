"""Exact token-block detection; semantic duplication requires review."""
import io
import re
import tokenize
import hashlib

MIN_TOKENS = 100
MIN_LINES = 10
TOKEN = re.compile(r'//[^\n]*|/\*[\s\S]*?\*/|#[^\n]*|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|`(?:\\.|[^`\\])*`|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|[^\s]')

def tokens(path):
    text = path.read_text(encoding='utf-8')
    if path.suffix == '.py':
        result = []
        ignored = {tokenize.COMMENT, tokenize.NL, tokenize.NEWLINE, tokenize.INDENT,
                   tokenize.DEDENT, tokenize.ENDMARKER, tokenize.ENCODING}
        for item in tokenize.generate_tokens(io.StringIO(text).readline):
            if item.type not in ignored:
                result.append((item.string, item.start[0], item.end[0]))
        return result
    result = []
    for match in TOKEN.finditer(text):
        value = match.group()
        if value.startswith(('//', '/*')) or (value.startswith('#') and path.suffix in {'.sh','.bash','.rb'}):
            continue
        result.append((value, text.count('\n', 0, match.start()) + 1,
                       text.count('\n', 0, match.end()) + 1))
    return result

def validate(root, paths, errors, affected=None, findings=None):
    seen, reported = {}, set()
    for path in paths:
        rel = path.relative_to(root).as_posix()
        try:
            items = tokens(path)
        except (OSError, UnicodeError, tokenize.TokenError, IndentationError):
            continue
        for index in range(len(items) - MIN_TOKENS + 1):
            block = items[index:index + MIN_TOKENS]
            if block[-1][2] - block[0][1] + 1 < MIN_LINES:
                continue
            signature = hashlib.sha256(repr([t[0] for t in block]).encode()).hexdigest()
            old = seen.get(signature)
            current = (rel, block[0][1], block[-1][2])
            if old and (old[0] != rel or current[1] > old[2]):
                pair = tuple(sorted((old[0], rel)))
                if pair not in reported:
                    message = f'duplicate code: {old[0]}:{old[1]} and {rel}:{current[1]} ({MIN_TOKENS}+ exact tokens); consolidate'
                    if findings is not None:findings.append({'paths':list(pair),'message':message})
                    if affected is None or set(pair) & affected:errors.append(message)
                    reported.add(pair)
            else:
                seen.setdefault(signature, current)
