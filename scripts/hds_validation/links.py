"""Offline Markdown links and GitHub-style heading anchors."""
from urllib.parse import unquote, urlsplit
import re

def visible(text,strip_inline=True):
    text=re.sub(r'^---\n.*?\n---\n','',text,flags=re.S)
    lines=[];fence=None
    for line in text.splitlines():
        m=re.match(r'^\s*(`{3,}|~{3,})',line)
        if m:
            if fence is None:fence=m[1]
            elif m[1][0]==fence[0] and len(m[1])>=len(fence):fence=None
            lines.append('');continue
        lines.append('' if fence else line)
    result='\n'.join(lines)
    return re.sub(r'`[^`\n]+`','',result) if strip_inline else result

def anchors(text):
    result=set();counts={}
    for line in visible(text,strip_inline=False).splitlines():
        match=re.match(r'^#{1,6}\s+(.*?)\s*#*$',line)
        if match:
            title=re.sub(r'<[^>]+>','',match[1]).lower()
            slug=re.sub(r'[^\w\-\s]','',title,flags=re.U).replace(' ','-')
            n=counts.get(slug,0);counts[slug]=n+1
            result.add(slug if n==0 else f'{slug}-{n}')
    result.update(re.findall(r'<(?:a|span)\s+[^>]*(?:id|name)=[\"\']([^\"\']+)',text))
    return result

def extract(text):
    references={}
    for match in re.finditer(r'^\s*\[([^\]]+)\]:\s*(<[^>]+>|\S+)',text,re.M):
        references[match[1].strip().lower()]=match[2].strip('<>')
    destinations=[]
    for match in re.finditer(r'!?\[[^\]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+[\"\'][^\n]*?[\"\'])?\s*\)',text):
        destinations.append(match[1].strip('<>'))
    missing=[]
    for match in re.finditer(r'!?\[([^\]\n]+)\]\[([^\]\n]*)\]',text):
        key=(match[2] or match[1]).strip().lower()
        if key in references:destinations.append(references[key])
        else:missing.append(key)
    destinations.extend(references.values())
    destinations.extend(re.findall(r'(?:href|src)=[\"\']([^\"\']+)',text))
    return destinations,missing

def validate(root,documents,errors):
    for rel,(_,body) in documents.items():
        try:destinations,missing=extract(visible(body))
        except ValueError as exc:
            errors.append(f'{rel}: link parsing failed {exc}');continue
        for key in missing:errors.append(f'{rel}: undefined link reference {key}')
        for destination in destinations:
            parsed=urlsplit(destination)
            if parsed.scheme:
                if parsed.scheme not in {'https','http','mailto'}:
                    errors.append(f'{rel}: unsupported link scheme {parsed.scheme}')
                continue
            if parsed.netloc:continue
            path=unquote(parsed.path)
            if path.startswith('/'):
                errors.append(f'{rel}: absolute local link forbidden {destination}');continue
            target=(root/rel).parent/path if path else root/rel
            if not target.resolve().is_relative_to(root.resolve()):
                errors.append(f'{rel}: link escapes repository {destination}');continue
            if not target.exists():
                errors.append(f'{rel}: broken local link {destination}');continue
            if target.is_symlink():
                errors.append(f'{rel}: symlink link target {destination}');continue
            if parsed.fragment and target.suffix=='.md':
                if unquote(parsed.fragment) not in anchors(target.read_text(encoding='utf-8')):
                    errors.append(f'{rel}: broken anchor {destination}')
