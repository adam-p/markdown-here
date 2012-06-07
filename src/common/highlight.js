/*
Syntax highlighting with language autodetection.
http://softwaremaniacs.org/soft/highlight/
*/

/*
Copyright (c) 2006, Ivan Sagalaev
All rights reserved.
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of highlight.js nor the names of its contributors 
      may be used to endorse or promote products derived from this software 
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/* adam-p: Added this line to support Firefox modules */
var EXPORTED_SYMBOLS = ['hljs'];

/* adam-p: Added this line so that the code can run without a real navigator object */
if (typeof(navigator) === 'undefined') navigator = {userAgent: 'Chrome or Firefox'};

/* adam-p: Concatonated all the language JS files to this file. */


var hljs = new function() {

  /* Utility functions */

  function escape(value) {
    return value.replace(/&/gm, '&amp;').replace(/</gm, '&lt;');
  }

  function langRe(language, value, global) {
    return RegExp(
      value,
      'm' + (language.case_insensitive ? 'i' : '') + (global ? 'g' : '')
    );
  }

  function findCode(pre) {
    for (var i = 0; i < pre.childNodes.length; i++) {
      var node = pre.childNodes[i];
      if (node.nodeName == 'CODE')
        return node;
      if (!(node.nodeType == 3 && node.nodeValue.match(/\s+/)))
        break;
    }
  }

  function blockText(block, ignoreNewLines) {
    var result = '';
    for (var i = 0; i < block.childNodes.length; i++)
      if (block.childNodes[i].nodeType == 3) {
        var chunk = block.childNodes[i].nodeValue;
        if (ignoreNewLines)
          chunk = chunk.replace(/\n/g, '');
        result += chunk;
      } else if (block.childNodes[i].nodeName == 'BR')
        result += '\n';
      else
        result += blockText(block.childNodes[i]);
    // Thank you, MSIE...
    if (/MSIE [678]/.test(navigator.userAgent))
      result = result.replace(/\r/g, '\n');
    return result;
  }

  function blockLanguage(block) {
    var classes = block.className.split(/\s+/);
    classes = classes.concat(block.parentNode.className.split(/\s+/));
    for (var i = 0; i < classes.length; i++) {
      var class_ = classes[i].replace(/^language-/, '');
      if (languages[class_] || class_ == 'no-highlight') {
        return class_;
      }
    }
  }

  /* Stream merging */

  function nodeStream(node) {
    var result = [];
    (function (node, offset) {
      for (var i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].nodeType == 3)
          offset += node.childNodes[i].nodeValue.length;
        else if (node.childNodes[i].nodeName == 'BR')
          offset += 1;
        else if (node.childNodes[i].nodeType == 1) {
          result.push({
            event: 'start',
            offset: offset,
            node: node.childNodes[i]
          });
          offset = arguments.callee(node.childNodes[i], offset);
          result.push({
            event: 'stop',
            offset: offset,
            node: node.childNodes[i]
          });
        }
      }
      return offset;
    })(node, 0);
    return result;
  }

  function mergeStreams(stream1, stream2, value) {
    var processed = 0;
    var result = '';
    var nodeStack = [];

    function selectStream() {
      if (stream1.length && stream2.length) {
        if (stream1[0].offset != stream2[0].offset)
          return (stream1[0].offset < stream2[0].offset) ? stream1 : stream2;
        else {
          /*
          To avoid starting the stream just before it should stop the order is
          ensured that stream1 always starts first and closes last:

          if (event1 == 'start' && event2 == 'start')
            return stream1;
          if (event1 == 'start' && event2 == 'stop')
            return stream2;
          if (event1 == 'stop' && event2 == 'start')
            return stream1;
          if (event1 == 'stop' && event2 == 'stop')
            return stream2;

          ... which is collapsed to:
          */
          return stream2[0].event == 'start' ? stream1 : stream2;
        }
      } else {
        return stream1.length ? stream1 : stream2;
      }
    }

    function open(node) {
      var result = '<' + node.nodeName.toLowerCase();
      for (var i = 0; i < node.attributes.length; i++) {
        var attribute = node.attributes[i];
        result += ' ' + attribute.nodeName.toLowerCase();
        if (attribute.value !== undefined && attribute.value !== false && attribute.value !== null) {
          result += '="' + escape(attribute.value) + '"';
        }
      }
      return result + '>';
    }

    while (stream1.length || stream2.length) {
      var current = selectStream().splice(0, 1)[0];
      result += escape(value.substr(processed, current.offset - processed));
      processed = current.offset;
      if ( current.event == 'start') {
        result += open(current.node);
        nodeStack.push(current.node);
      } else if (current.event == 'stop') {
        var node, i = nodeStack.length;
        do {
          i--;
          node = nodeStack[i];
          result += ('</' + node.nodeName.toLowerCase() + '>');
        } while (node != current.node);
        nodeStack.splice(i, 1);
        while (i < nodeStack.length) {
          result += open(nodeStack[i]);
          i++;
        }
      }
    }
    return result + escape(value.substr(processed));
  }

  /* Initialization */

  function compileModes() {

    function compileMode(mode, language, is_default) {
      if (mode.compiled)
        return;
      var group;

      if (!is_default) {
        mode.beginRe = langRe(language, mode.begin ? mode.begin : '\\B|\\b');
        if (!mode.end && !mode.endsWithParent)
          mode.end = '\\B|\\b';
        if (mode.end)
          mode.endRe = langRe(language, mode.end);
      }
      if (mode.illegal)
        mode.illegalRe = langRe(language, mode.illegal);
      if (mode.relevance === undefined)
        mode.relevance = 1;
      if (mode.keywords) {
        mode.lexemsRe = langRe(language, mode.lexems || hljs.IDENT_RE, true);
        for (var className in mode.keywords) {
          if (!mode.keywords.hasOwnProperty(className))
            continue;
          if (mode.keywords[className] instanceof Object) {
            group = mode.keywords[className];
          } else {
            group = mode.keywords;
            className = 'keyword';
          }
          for (var keyword in group) {
            if (!group.hasOwnProperty(keyword))
              continue;
            mode.keywords[keyword] = [className, group[keyword]];
          }
        }
      }
      if (!mode.contains) {
        mode.contains = [];
      }
      // compiled flag is set before compiling submodes to avoid self-recursion
      // (see lisp where quoted_list contains quoted_list)
      mode.compiled = true;
      for (var i = 0; i < mode.contains.length; i++) {
        if (mode.contains[i] == 'self') {
          mode.contains[i] = mode;
        }
        compileMode(mode.contains[i], language, false);
      }
      if (mode.starts) {
        compileMode(mode.starts, language, false);
      }
    }

    for (var i in languages) {
      if (!languages.hasOwnProperty(i))
        continue;
      compileMode(languages[i].defaultMode, languages[i], true);
    }
  }

  /*
  Core highlighting function. Accepts a language name and a string with the
  code to highlight. Returns an object with the following properties:

  - relevance (int)
  - keyword_count (int)
  - value (an HTML string with highlighting markup)

  */
  function highlight(language_name, value) {
    if (!compileModes.called) {
      compileModes();
      compileModes.called = true;
    }

    function subMode(lexem, mode) {
      for (var i = 0; i < mode.contains.length; i++) {
        if (mode.contains[i].beginRe.test(lexem)) {
          return mode.contains[i];
        }
      }
    }

    function endOfMode(mode_index, lexem) {
      if (modes[mode_index].end && modes[mode_index].endRe.test(lexem))
        return 1;
      if (modes[mode_index].endsWithParent) {
        var level = endOfMode(mode_index - 1, lexem);
        return level ? level + 1 : 0;
      }
      return 0;
    }

    function isIllegal(lexem, mode) {
      return mode.illegal && mode.illegalRe.test(lexem);
    }

    function compileTerminators(mode, language) {
      var terminators = [];

      for (var i = 0; i < mode.contains.length; i++) {
        terminators.push(mode.contains[i].begin);
      }

      var index = modes.length - 1;
      do {
        if (modes[index].end) {
          terminators.push(modes[index].end);
        }
        index--;
      } while (modes[index + 1].endsWithParent);

      if (mode.illegal) {
        terminators.push(mode.illegal);
      }

      return langRe(language, '(' + terminators.join('|') + ')', true);
    }

    function eatModeChunk(value, index) {
      var mode = modes[modes.length - 1];
      if (!mode.terminators) {
        mode.terminators = compileTerminators(mode, language);
      }
      mode.terminators.lastIndex = index;
      var match = mode.terminators.exec(value);
      if (match)
        return [value.substr(index, match.index - index), match[0], false];
      else
        return [value.substr(index), '', true];
    }

    function keywordMatch(mode, match) {
      var match_str = language.case_insensitive ? match[0].toLowerCase() : match[0];
      var value = mode.keywords[match_str];
      if (value && value instanceof Array)
          return value;
      return false;
    }

    function processKeywords(buffer, mode) {
      buffer = escape(buffer);
      if (!mode.keywords)
        return buffer;
      var result = '';
      var last_index = 0;
      mode.lexemsRe.lastIndex = 0;
      var match = mode.lexemsRe.exec(buffer);
      while (match) {
        result += buffer.substr(last_index, match.index - last_index);
        var keyword_match = keywordMatch(mode, match);
        if (keyword_match) {
          keyword_count += keyword_match[1];
          result += '<span class="'+ keyword_match[0] +'">' + match[0] + '</span>';
        } else {
          result += match[0];
        }
        last_index = mode.lexemsRe.lastIndex;
        match = mode.lexemsRe.exec(buffer);
      }
      return result + buffer.substr(last_index, buffer.length - last_index);
    }

    function processBuffer(buffer, mode) {
      if (mode.subLanguage && languages[mode.subLanguage]) {
        var result = highlight(mode.subLanguage, buffer);
        keyword_count += result.keyword_count;
        return result.value;
      } else {
        return processKeywords(buffer, mode);
      }
    }

    function startNewMode(mode, lexem) {
      var markup = mode.className?'<span class="' + mode.className + '">':'';
      if (mode.returnBegin) {
        result += markup;
        mode.buffer = '';
      } else if (mode.excludeBegin) {
        result += escape(lexem) + markup;
        mode.buffer = '';
      } else {
        result += markup;
        mode.buffer = lexem;
      }
      modes.push(mode);
      relevance += mode.relevance;
    }

    function processModeInfo(buffer, lexem, end) {
      var current_mode = modes[modes.length - 1];
      if (end) {
        result += processBuffer(current_mode.buffer + buffer, current_mode);
        return false;
      }

      var new_mode = subMode(lexem, current_mode);
      if (new_mode) {
        result += processBuffer(current_mode.buffer + buffer, current_mode);
        startNewMode(new_mode, lexem);
        return new_mode.returnBegin;
      }

      var end_level = endOfMode(modes.length - 1, lexem);
      if (end_level) {
        var markup = current_mode.className?'</span>':'';
        if (current_mode.returnEnd) {
          result += processBuffer(current_mode.buffer + buffer, current_mode) + markup;
        } else if (current_mode.excludeEnd) {
          result += processBuffer(current_mode.buffer + buffer, current_mode) + markup + escape(lexem);
        } else {
          result += processBuffer(current_mode.buffer + buffer + lexem, current_mode) + markup;
        }
        while (end_level > 1) {
          markup = modes[modes.length - 2].className?'</span>':'';
          result += markup;
          end_level--;
          modes.length--;
        }
        var last_ended_mode = modes[modes.length - 1];
        modes.length--;
        modes[modes.length - 1].buffer = '';
        if (last_ended_mode.starts) {
          startNewMode(last_ended_mode.starts, '');
        }
        return current_mode.returnEnd;
      }

      if (isIllegal(lexem, current_mode))
        throw 'Illegal';
    }

    var language = languages[language_name];
    var modes = [language.defaultMode];
    var relevance = 0;
    var keyword_count = 0;
    var result = '';
    try {
      var mode_info, index = 0;
      language.defaultMode.buffer = '';
      do {
        mode_info = eatModeChunk(value, index);
        var return_lexem = processModeInfo(mode_info[0], mode_info[1], mode_info[2]);
        index += mode_info[0].length;
        if (!return_lexem) {
          index += mode_info[1].length;
        }
      } while (!mode_info[2]);
      if(modes.length > 1)
        throw 'Illegal';
      return {
        relevance: relevance,
        keyword_count: keyword_count,
        value: result
      };
    } catch (e) {
      if (e == 'Illegal') {
        return {
          relevance: 0,
          keyword_count: 0,
          value: escape(value)
        };
      } else {
        throw e;
      }
    }
  }

  /*
  Highlighting with language detection. Accepts a string with the code to
  highlight. Returns an object with the following properties:

  - language (detected language)
  - relevance (int)
  - keyword_count (int)
  - value (an HTML string with highlighting markup)
  - second_best (object with the same structure for second-best heuristically
    detected language, may be absent)

  */
  function highlightAuto(text) {
    var result = {
      keyword_count: 0,
      relevance: 0,
      value: escape(text)
    };
    var second_best = result;
    for (var key in languages) {
      if (!languages.hasOwnProperty(key))
        continue;
      var current = highlight(key, text);
      current.language = key;
      if (current.keyword_count + current.relevance > second_best.keyword_count + second_best.relevance) {
        second_best = current;
      }
      if (current.keyword_count + current.relevance > result.keyword_count + result.relevance) {
        second_best = result;
        result = current;
      }
    }
    if (second_best.language) {
      result.second_best = second_best;
    }
    return result;
  }

  /*
  Post-processing of the highlighted markup:

  - replace TABs with something more useful
  - replace real line-breaks with '<br>' for non-pre containers

  */
  function fixMarkup(value, tabReplace, useBR) {
    if (tabReplace) {
      value = value.replace(/^((<[^>]+>|\t)+)/gm, function(match, p1, offset, s) {
        return p1.replace(/\t/g, tabReplace);
      });
    }
    if (useBR) {
      value = value.replace(/\n/g, '<br>');
    }
    return value;
  }

  /*
  Applies highlighting to a DOM node containing code. Accepts a DOM node and
  two optional parameters for fixMarkup.
  */
  function highlightBlock(block, tabReplace, useBR) {
    var text = blockText(block, useBR);
    var language = blockLanguage(block);
    var result, pre;
    if (language == 'no-highlight')
        return;
    if (language) {
      result = highlight(language, text);
    } else {
      result = highlightAuto(text);
      language = result.language;
    }
    var original = nodeStream(block);
    if (original.length) {
      pre = document.createElement('pre');
      pre.innerHTML = result.value;
      result.value = mergeStreams(original, nodeStream(pre), text);
    }
    result.value = fixMarkup(result.value, tabReplace, useBR);

    var class_name = block.className;
    if (!class_name.match('(\\s|^)(language-)?' + language + '(\\s|$)')) {
      class_name = class_name ? (class_name + ' ' + language) : language;
    }
    if (/MSIE [678]/.test(navigator.userAgent) && block.tagName == 'CODE' && block.parentNode.tagName == 'PRE') {
      // This is for backwards compatibility only. IE needs this strange
      // hack becasue it cannot just cleanly replace <code> block contents.
      pre = block.parentNode;
      var container = document.createElement('div');
      container.innerHTML = '<pre><code>' + result.value + '</code></pre>';
      block = container.firstChild.firstChild;
      container.firstChild.className = pre.className;
      pre.parentNode.replaceChild(container.firstChild, pre);
    } else {
      block.innerHTML = result.value;
    }
    block.className = class_name;
    block.result = {
      language: language,
      kw: result.keyword_count,
      re: result.relevance
    };
    if (result.second_best) {
      block.second_best = {
        language: result.second_best.language,
        kw: result.second_best.keyword_count,
        re: result.second_best.relevance
      };
    }
  }

  /*
  Applies highlighting to all <pre><code>..</code></pre> blocks on a page.
  */
  function initHighlighting() {
    if (initHighlighting.called)
      return;
    initHighlighting.called = true;
    var pres = document.getElementsByTagName('pre');
    for (var i = 0; i < pres.length; i++) {
      var code = findCode(pres[i]);
      if (code)
        highlightBlock(code, hljs.tabReplace);
    }
  }

  /*
  Attaches highlighting to the page load event.
  */
  function initHighlightingOnLoad() {
    if (window.addEventListener) {
      window.addEventListener('DOMContentLoaded', initHighlighting, false);
      window.addEventListener('load', initHighlighting, false);
    } else if (window.attachEvent)
      window.attachEvent('onload', initHighlighting);
    else
      window.onload = initHighlighting;
  }

  var languages = {}; // a shortcut to avoid writing "this." everywhere

  /* Interface definition */

  this.LANGUAGES = languages;
  this.highlight = highlight;
  this.highlightAuto = highlightAuto;
  this.fixMarkup = fixMarkup;
  this.highlightBlock = highlightBlock;
  this.initHighlighting = initHighlighting;
  this.initHighlightingOnLoad = initHighlightingOnLoad;

  // Common regexps
  this.IDENT_RE = '[a-zA-Z][a-zA-Z0-9_]*';
  this.UNDERSCORE_IDENT_RE = '[a-zA-Z_][a-zA-Z0-9_]*';
  this.NUMBER_RE = '\\b\\d+(\\.\\d+)?';
  this.C_NUMBER_RE = '\\b(0[xX][a-fA-F0-9]+|(\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)'; // 0x..., 0..., decimal, float
  this.BINARY_NUMBER_RE = '\\b(0b[01]+)'; // 0b...
  this.RE_STARTERS_RE = '!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|\\.|-|-=|/|/=|:|;|<|<<|<<=|<=|=|==|===|>|>=|>>|>>=|>>>|>>>=|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~';

  // Common modes
  this.BACKSLASH_ESCAPE = {
    begin: '\\\\.', relevance: 0
  };
  this.APOS_STRING_MODE = {
    className: 'string',
    begin: '\'', end: '\'',
    illegal: '\\n',
    contains: [this.BACKSLASH_ESCAPE],
    relevance: 0
  };
  this.QUOTE_STRING_MODE = {
    className: 'string',
    begin: '"', end: '"',
    illegal: '\\n',
    contains: [this.BACKSLASH_ESCAPE],
    relevance: 0
  };
  this.C_LINE_COMMENT_MODE = {
    className: 'comment',
    begin: '//', end: '$'
  };
  this.C_BLOCK_COMMENT_MODE = {
    className: 'comment',
    begin: '/\\*', end: '\\*/'
  };
  this.HASH_COMMENT_MODE = {
    className: 'comment',
    begin: '#', end: '$'
  };
  this.NUMBER_MODE = {
    className: 'number',
    begin: this.NUMBER_RE,
    relevance: 0
  };
  this.C_NUMBER_MODE = {
    className: 'number',
    begin: this.C_NUMBER_RE,
    relevance: 0
  };
  this.BINARY_NUMBER_MODE = {
    className: 'number',
    begin: this.BINARY_NUMBER_RE,
    relevance: 0
  };

  // Utility functions
  this.inherit = function(parent, obj) {
    var result = {}
    for (var key in parent)
      result[key] = parent[key];
    if (obj)
      for (var key in obj)
        result[key] = obj[key];
    return result;
  }
}();

/*
Language: HTML, XML
*/

hljs.LANGUAGES.xml = function(){
  var XML_IDENT_RE = '[A-Za-z0-9\\._:-]+';
  var TAG_INTERNALS = {
    endsWithParent: true,
    contains: [
      {
        className: 'attribute',
        begin: XML_IDENT_RE,
        relevance: 0
      },
      {
        begin: '="', returnBegin: true, end: '"',
        contains: [{
            className: 'value',
            begin: '"', endsWithParent: true
        }]
      },
      {
        begin: '=\'', returnBegin: true, end: '\'',
        contains: [{
          className: 'value',
          begin: '\'', endsWithParent: true
        }]
      },
      {
        begin: '=',
        contains: [{
          className: 'value',
          begin: '[^\\s/>]+'
        }]
      }
    ]
  };
  return {
    case_insensitive: true,
    defaultMode: {
      contains: [
        {
          className: 'pi',
          begin: '<\\?', end: '\\?>',
          relevance: 10
        },
        {
          className: 'doctype',
          begin: '<!DOCTYPE', end: '>',
          relevance: 10,
          contains: [{begin: '\\[', end: '\\]'}]
        },
        {
          className: 'comment',
          begin: '<!--', end: '-->',
          relevance: 10
        },
        {
          className: 'cdata',
          begin: '<\\!\\[CDATA\\[', end: '\\]\\]>',
          relevance: 10
        },
        {
          className: 'tag',
          /*
          The lookahead pattern (?=...) ensures that 'begin' only matches
          '<style' as a single word, followed by a whitespace or an
          ending braket. The '$' is needed for the lexem to be recognized
          by hljs.subMode() that tests lexems outside the stream.
          */
          begin: '<style(?=\\s|>|$)', end: '>',
          keywords: {'title': {'style': 1}},
          contains: [TAG_INTERNALS],
          starts: {
            className: 'css',
            end: '</style>', returnEnd: true,
            subLanguage: 'css'
          }
        },
        {
          className: 'tag',
          // See the comment in the <style tag about the lookahead pattern
          begin: '<script(?=\\s|>|$)', end: '>',
          keywords: {'title': {'script': 1}},
          contains: [TAG_INTERNALS],
          starts: {
            className: 'javascript',
            end: '</script>', returnEnd: true,
            subLanguage: 'javascript'
          }
        },
        {
          className: 'vbscript',
          begin: '<%', end: '%>',
          subLanguage: 'vbscript'
        },
        {
          className: 'tag',
          begin: '</?', end: '/?>',
          contains: [
            {
              className: 'title', begin: '[^ />]+'
            },
            TAG_INTERNALS
          ]
        }
      ]
    }
  };
}();

/*
Language: 1C
Author: Yuri Ivanov <ivanov@supersoft.ru>
Contributors: Sergey Baranov <segyrn@yandex.ru>
*/

hljs.LANGUAGES['1c'] = function(){
  var IDENT_RE_RU = '[a-zA-Zа-яА-Я][a-zA-Z0-9_а-яА-Я]*';
  var OneS_KEYWORDS = {
    'возврат':1,'дата':1,'для':1,'если':1,'и':1,'или':1,'иначе':1,'иначеесли':1,'исключение':1,'конецесли':1,
    'конецпопытки':1,'конецпроцедуры':1,'конецфункции':1,'конеццикла':1,'константа':1,'не':1,'перейти':1,'перем':1,
    'перечисление':1,'по':1,'пока':1,'попытка':1,'прервать':1,'продолжить':1,'процедура':1,'строка':1,'тогда':1,
    'фс':1,'функция':1,'цикл':1,'число':1,'экспорт':1
  };
  var OneS_BUILT_IN = {
    'ansitooem':1,'oemtoansi':1,'ввестивидсубконто':1,'ввестидату':1,'ввестизначение':1,'ввестиперечисление':1,
    'ввестипериод':1,'ввестиплансчетов':1,'ввестистроку':1,'ввестичисло':1,'вопрос':1,'восстановитьзначение':1,
    'врег':1,'выбранныйплансчетов':1,'вызватьисключение':1,'датагод':1,'датамесяц':1,'датачисло':1,'добавитьмесяц':1,
    'завершитьработусистемы':1,'заголовоксистемы':1,'записьжурналарегистрации':1,'запуститьприложение':1,
    'зафиксироватьтранзакцию':1,'значениевстроку':1,'значениевстрокувнутр':1,'значениевфайл':1,'значениеизстроки':1,
    'значениеизстрокивнутр':1,'значениеизфайла':1,'имякомпьютера':1,'имяпользователя':1,'каталогвременныхфайлов':1,
    'каталогиб':1,'каталогпользователя':1,'каталогпрограммы':1,'кодсимв':1,'командасистемы':1,'конгода':1,
    'конецпериодаби':1,'конецрассчитанногопериодаби':1,'конецстандартногоинтервала':1,'конквартала':1,'конмесяца':1,
    'коннедели':1,'лев':1,'лог':1,'лог10':1,'макс':1,'максимальноеколичествосубконто':1,'мин':1,'монопольныйрежим':1,
    'названиеинтерфейса':1,'названиенабораправ':1,'назначитьвид':1,'назначитьсчет':1,'найти':1,
    'найтипомеченныенаудаление':1,'найтиссылки':1,'началопериодаби':1,'началостандартногоинтервала':1,
    'начатьтранзакцию':1,'начгода':1,'начквартала':1,'начмесяца':1,'начнедели':1,'номерднягода':1,'номерднянедели':1,
    'номернеделигода':1,'нрег':1,'обработкаожидания':1,'окр':1,'описаниеошибки':1,'основнойжурналрасчетов':1,
    'основнойплансчетов':1,'основнойязык':1,'открытьформу':1,'открытьформумодально':1,'отменитьтранзакцию':1,
    'очиститьокносообщений':1,'периодстр':1,'полноеимяпользователя':1,'получитьвремята':1,'получитьдатута':1,
    'получитьдокументта':1,'получитьзначенияотбора':1,'получитьпозициюта':1,'получитьпустоезначение':1,
    'получитьта':1,'прав':1,'праводоступа':1,'предупреждение':1,'префиксавтонумерации':1,'пустаястрока':1,
    'пустоезначение':1,'рабочаядаттьпустоезначение':1,'рабочаядата':1,'разделительстраниц':1,'разделительстрок':1,
    'разм':1,'разобратьпозициюдокумента':1,'рассчитатьрегистрына':1,'рассчитатьрегистрыпо':1,'сигнал':1,'симв':1,
    'символтабуляции':1,'создатьобъект':1,'сокрл':1,'сокрлп':1,'сокрп':1,' сообщить':1,'состояние':1,
    'сохранитьзначение':1,'сред':1,'статусвозврата':1,'стрдлина':1,'стрзаменить':1,'стрколичествострок':1,
    'стрполучитьстроку':1,' стрчисловхождений':1,'сформироватьпозициюдокумента':1,'счетпокоду':1,'текущаядата':1,
    'текущеевремя':1,'типзначения':1,'типзначениястр':1,'удалитьобъекты':1,'установитьтана':1,'установитьтапо':1,
    'фиксшаблон':1,'формат':1,'цел':1,'шаблон':1
  };
  var DQUOTE =  {className: 'dquote',  begin: '""'};
  var STR_START = {
      className: 'string',
      begin: '"', end: '"|$',
      contains: [DQUOTE],
      relevance: 0
    };
  var STR_CONT = {
    className: 'string',
    begin: '\\|', end: '"|$',
    contains: [DQUOTE]
  };

  return {
    case_insensitive: true,
    defaultMode: {
      lexems: IDENT_RE_RU,
      keywords: {'keyword':OneS_KEYWORDS,'built_in':OneS_BUILT_IN},
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.NUMBER_MODE,
        STR_START, STR_CONT,
        {
          className: 'function',
          begin: '(процедура|функция)', end: '$',
          lexems: IDENT_RE_RU,
          keywords: {'процедура': 1, 'экспорт': 1, 'функция': 1},
          contains: [
            {className: 'title', begin: IDENT_RE_RU},
            {
              className: 'tail',
              endsWithParent: true,
              contains: [
                {
                  className: 'params',
                  begin: '\\(', end: '\\)',
                  lexems: IDENT_RE_RU,
                  keywords: {'знач':1},
                  contains: [STR_START, STR_CONT]
                },
                {
                  className: 'export',
                  begin: 'экспорт', endsWithParent: true,
                  lexems: IDENT_RE_RU,
                  keywords: {'экспорт': 1},
                  contains: [hljs.C_LINE_COMMENT_MODE]
                }
              ]
            },
            hljs.C_LINE_COMMENT_MODE
          ]
        },
        {className: 'preprocessor', begin: '#', end: '$'},
        {className: 'date', begin: '\'\\d{2}\\.\\d{2}\\.(\\d{2}|\\d{4})\''}
      ]
    }
  };
}();
/*
Language: ActionScript
Author: Alexander Myadzel <myadzel@gmail.com>
*/

hljs.LANGUAGES.actionscript = function() {
  var IDENT_RE = '[a-zA-Z_$][a-zA-Z0-9_$]*';
  var IDENT_FUNC_RETURN_TYPE_RE = '([*]|[a-zA-Z_$][a-zA-Z0-9_$]*)';

  var AS3_REST_ARG_MODE = {
    className: 'rest_arg',
    begin: '[.]{3}', end: IDENT_RE,
    relevance: 10
  };
  var TITLE_MODE = {className: 'title', begin: IDENT_RE};

  return {
    defaultMode: {
      keywords: {
        'keyword': {
          'as': 1, 'break': 1, 'case': 1, 'catch': 1, 'class': 1, 'const': 1, 'continue': 1, 'default': 1,
          'delete': 1, 'do': 1, 'dynamic': 5, 'each': 1, 'else': 1, 'extends': 1, 'final': 1, 'finally': 1,
          'for': 1, 'function': 1, 'get': 1, 'if': 1, 'implements': 1, 'import': 1, 'in': 1, 'include': 1,
          'instanceof': 1, 'interface': 1, 'internal': 1, 'is': 1, 'namespace': 1, 'native': 1, 'new': 1,
          'override': 1, 'package': 1, 'private': 1, 'protected': 1, 'public': 1, 'return': 1, 'set': 1,
          'static': 1, 'super': 5, 'switch': 1, 'this': 1, 'throw': 1, 'try': 1, 'typeof': 1, 'use': 1,
          'var': 1, 'void': 1, 'while': 1, 'with': 1
        },
        'literal': {'true': 1, 'false': 1, 'null': 1, 'undefined': 1},
        'reserved': {
          'abstract': 0, 'boolean': 0, 'byte': 0, 'cast': 0, 'char': 0, 'debugger': 0, 'double': 0, 'enum': 0,
          'export': 0, 'float': 0, 'goto': 0, 'intrinsic': 0, 'long': 0, 'prototype': 0, 'short': 0,
          'synchronized': 0, 'throws': 0, 'to': 0, 'transient': 0, 'type': 0, 'virtual': 0, 'volatile': 0
        }
      },
      contains: [
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.C_NUMBER_MODE,
        {
          className: 'package',
          begin: 'package ?', end: '{',
          keywords: {'package': 1},
          contains: [TITLE_MODE]
        },
        {
          className: 'class',
          begin: '(class|interface) ', end: '{',
          keywords: {'class': 1, 'interface': 1},
          contains: [
            {
              begin: '(implements|extends)',
              keywords: {'extends': 1, 'implements': 1},
              relevance: 5
            },
            TITLE_MODE
          ]
        },
        {
          className: 'preprocessor',
          begin: '(import|include)\\b', end: ';',
          keywords: {'import': 1, 'include': 1}
        },
        {
          className: 'function',
          begin: 'function ', end: '[{;]',
          keywords: {'function': 1},
          contains: [
            TITLE_MODE,
            {
              className: 'params',
              begin: '\\(', end: '\\)',
              contains: [
                hljs.APOS_STRING_MODE,
                hljs.QUOTE_STRING_MODE,
                hljs.C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                AS3_REST_ARG_MODE
              ]
            },
            {
              className: 'type',
              begin: ':',
              end: IDENT_FUNC_RETURN_TYPE_RE,
              relevance: 10
            }
          ]
        }
      ]
    }
  }
}();
/*
Language: Apache
Author: Ruslan Keba <rukeba@gmail.com>
Website: http://rukeba.com/
Description: language definition for Apache configuration files (httpd.conf & .htaccess)
Version: 1.1
Date: 2008-12-27
*/

hljs.LANGUAGES.apache = function(){
  var NUMBER = {className: 'number', begin: '[\\$%]\\d+'};
  return {
    case_insensitive: true,
    defaultMode: {
      keywords: {
        'keyword': {
          'acceptfilter': 1,
          'acceptmutex': 1,
          'acceptpathinfo': 1,
          'accessfilename': 1,
          'action': 1,
          'addalt': 1,
          'addaltbyencoding': 1,
          'addaltbytype': 1,
          'addcharset': 1,
          'adddefaultcharset': 1,
          'adddescription': 1,
          'addencoding': 1,
          'addhandler': 1,
          'addicon': 1,
          'addiconbyencoding': 1,
          'addiconbytype': 1,
          'addinputfilter': 1,
          'addlanguage': 1,
          'addmoduleinfo': 1,
          'addoutputfilter': 1,
          'addoutputfilterbytype': 1,
          'addtype': 1,
          'alias': 1,
          'aliasmatch': 1,
          'allow': 1,
          'allowconnect': 1,
          'allowencodedslashes': 1,
          'allowoverride': 1,
          'anonymous': 1,
          'anonymous_logemail': 1,
          'anonymous_mustgiveemail': 1,
          'anonymous_nouserid': 1,
          'anonymous_verifyemail': 1,
          'authbasicauthoritative': 1,
          'authbasicprovider': 1,
          'authdbduserpwquery': 1,
          'authdbduserrealmquery': 1,
          'authdbmgroupfile': 1,
          'authdbmtype': 1,
          'authdbmuserfile': 1,
          'authdefaultauthoritative': 1,
          'authdigestalgorithm': 1,
          'authdigestdomain': 1,
          'authdigestnccheck': 1,
          'authdigestnonceformat': 1,
          'authdigestnoncelifetime': 1,
          'authdigestprovider': 1,
          'authdigestqop': 1,
          'authdigestshmemsize': 1,
          'authgroupfile': 1,
          'authldapbinddn': 1,
          'authldapbindpassword': 1,
          'authldapcharsetconfig': 1,
          'authldapcomparednonserver': 1,
          'authldapdereferencealiases': 1,
          'authldapgroupattribute': 1,
          'authldapgroupattributeisdn': 1,
          'authldapremoteuserattribute': 1,
          'authldapremoteuserisdn': 1,
          'authldapurl': 1,
          'authname': 1,
          'authnprovideralias': 1,
          'authtype': 1,
          'authuserfile': 1,
          'authzdbmauthoritative': 1,
          'authzdbmtype': 1,
          'authzdefaultauthoritative': 1,
          'authzgroupfileauthoritative': 1,
          'authzldapauthoritative': 1,
          'authzownerauthoritative': 1,
          'authzuserauthoritative': 1,
          'balancermember': 1,
          'browsermatch': 1,
          'browsermatchnocase': 1,
          'bufferedlogs': 1,
          'cachedefaultexpire': 1,
          'cachedirlength': 1,
          'cachedirlevels': 1,
          'cachedisable': 1,
          'cacheenable': 1,
          'cachefile': 1,
          'cacheignorecachecontrol': 1,
          'cacheignoreheaders': 1,
          'cacheignorenolastmod': 1,
          'cacheignorequerystring': 1,
          'cachelastmodifiedfactor': 1,
          'cachemaxexpire': 1,
          'cachemaxfilesize': 1,
          'cacheminfilesize': 1,
          'cachenegotiateddocs': 1,
          'cacheroot': 1,
          'cachestorenostore': 1,
          'cachestoreprivate': 1,
          'cgimapextension': 1,
          'charsetdefault': 1,
          'charsetoptions': 1,
          'charsetsourceenc': 1,
          'checkcaseonly': 1,
          'checkspelling': 1,
          'chrootdir': 1,
          'contentdigest': 1,
          'cookiedomain': 1,
          'cookieexpires': 1,
          'cookielog': 1,
          'cookiename': 1,
          'cookiestyle': 1,
          'cookietracking': 1,
          'coredumpdirectory': 1,
          'customlog': 1,
          'dav': 1,
          'davdepthinfinity': 1,
          'davgenericlockdb': 1,
          'davlockdb': 1,
          'davmintimeout': 1,
          'dbdexptime': 1,
          'dbdkeep': 1,
          'dbdmax': 1,
          'dbdmin': 1,
          'dbdparams': 1,
          'dbdpersist': 1,
          'dbdpreparesql': 1,
          'dbdriver': 1,
          'defaulticon': 1,
          'defaultlanguage': 1,
          'defaulttype': 1,
          'deflatebuffersize': 1,
          'deflatecompressionlevel': 1,
          'deflatefilternote': 1,
          'deflatememlevel': 1,
          'deflatewindowsize': 1,
          'deny': 1,
          'directoryindex': 1,
          'directorymatch': 1,
          'directoryslash': 1,
          'documentroot': 1,
          'dumpioinput': 1,
          'dumpiologlevel': 1,
          'dumpiooutput': 1,
          'enableexceptionhook': 1,
          'enablemmap': 1,
          'enablesendfile': 1,
          'errordocument': 1,
          'errorlog': 1,
          'example': 1,
          'expiresactive': 1,
          'expiresbytype': 1,
          'expiresdefault': 1,
          'extendedstatus': 1,
          'extfilterdefine': 1,
          'extfilteroptions': 1,
          'fileetag': 1,
          'filterchain': 1,
          'filterdeclare': 1,
          'filterprotocol': 1,
          'filterprovider': 1,
          'filtertrace': 1,
          'forcelanguagepriority': 1,
          'forcetype': 1,
          'forensiclog': 1,
          'gracefulshutdowntimeout': 1,
          'group': 1,
          'header': 1,
          'headername': 1,
          'hostnamelookups': 1,
          'identitycheck': 1,
          'identitychecktimeout': 1,
          'imapbase': 1,
          'imapdefault': 1,
          'imapmenu': 1,
          'include': 1,
          'indexheadinsert': 1,
          'indexignore': 1,
          'indexoptions': 1,
          'indexorderdefault': 1,
          'indexstylesheet': 1,
          'isapiappendlogtoerrors': 1,
          'isapiappendlogtoquery': 1,
          'isapicachefile': 1,
          'isapifakeasync': 1,
          'isapilognotsupported': 1,
          'isapireadaheadbuffer': 1,
          'keepalive': 1,
          'keepalivetimeout': 1,
          'languagepriority': 1,
          'ldapcacheentries': 1,
          'ldapcachettl': 1,
          'ldapconnectiontimeout': 1,
          'ldapopcacheentries': 1,
          'ldapopcachettl': 1,
          'ldapsharedcachefile': 1,
          'ldapsharedcachesize': 1,
          'ldaptrustedclientcert': 1,
          'ldaptrustedglobalcert': 1,
          'ldaptrustedmode': 1,
          'ldapverifyservercert': 1,
          'limitinternalrecursion': 1,
          'limitrequestbody': 1,
          'limitrequestfields': 1,
          'limitrequestfieldsize': 1,
          'limitrequestline': 1,
          'limitxmlrequestbody': 1,
          'listen': 1,
          'listenbacklog': 1,
          'loadfile': 1,
          'loadmodule': 1,
          'lockfile': 1,
          'logformat': 1,
          'loglevel': 1,
          'maxclients': 1,
          'maxkeepaliverequests': 1,
          'maxmemfree': 1,
          'maxrequestsperchild': 1,
          'maxrequestsperthread': 1,
          'maxspareservers': 1,
          'maxsparethreads': 1,
          'maxthreads': 1,
          'mcachemaxobjectcount': 1,
          'mcachemaxobjectsize': 1,
          'mcachemaxstreamingbuffer': 1,
          'mcacheminobjectsize': 1,
          'mcacheremovalalgorithm': 1,
          'mcachesize': 1,
          'metadir': 1,
          'metafiles': 1,
          'metasuffix': 1,
          'mimemagicfile': 1,
          'minspareservers': 1,
          'minsparethreads': 1,
          'mmapfile': 1,
          'mod_gzip_on': 1,
          'mod_gzip_add_header_count': 1,
          'mod_gzip_keep_workfiles': 1,
          'mod_gzip_dechunk': 1,
          'mod_gzip_min_http': 1,
          'mod_gzip_minimum_file_size': 1,
          'mod_gzip_maximum_file_size': 1,
          'mod_gzip_maximum_inmem_size': 1,
          'mod_gzip_temp_dir': 1,
          'mod_gzip_item_include': 1,
          'mod_gzip_item_exclude': 1,
          'mod_gzip_command_version': 1,
          'mod_gzip_can_negotiate': 1,
          'mod_gzip_handle_methods': 1,
          'mod_gzip_static_suffix': 1,
          'mod_gzip_send_vary': 1,
          'mod_gzip_update_static': 1,
          'modmimeusepathinfo': 1,
          'multiviewsmatch': 1,
          'namevirtualhost': 1,
          'noproxy': 1,
          'nwssltrustedcerts': 1,
          'nwsslupgradeable': 1,
          'options': 1,
          'order': 1,
          'passenv': 1,
          'pidfile': 1,
          'protocolecho': 1,
          'proxybadheader': 1,
          'proxyblock': 1,
          'proxydomain': 1,
          'proxyerroroverride': 1,
          'proxyftpdircharset': 1,
          'proxyiobuffersize': 1,
          'proxymaxforwards': 1,
          'proxypass': 1,
          'proxypassinterpolateenv': 1,
          'proxypassmatch': 1,
          'proxypassreverse': 1,
          'proxypassreversecookiedomain': 1,
          'proxypassreversecookiepath': 1,
          'proxypreservehost': 1,
          'proxyreceivebuffersize': 1,
          'proxyremote': 1,
          'proxyremotematch': 1,
          'proxyrequests': 1,
          'proxyset': 1,
          'proxystatus': 1,
          'proxytimeout': 1,
          'proxyvia': 1,
          'readmename': 1,
          'receivebuffersize': 1,
          'redirect': 1,
          'redirectmatch': 1,
          'redirectpermanent': 1,
          'redirecttemp': 1,
          'removecharset': 1,
          'removeencoding': 1,
          'removehandler': 1,
          'removeinputfilter': 1,
          'removelanguage': 1,
          'removeoutputfilter': 1,
          'removetype': 1,
          'requestheader': 1,
          'require': 2,
          'rewritebase': 1,
          'rewritecond': 10,
          'rewriteengine': 1,
          'rewritelock': 1,
          'rewritelog': 1,
          'rewriteloglevel': 1,
          'rewritemap': 1,
          'rewriteoptions': 1,
          'rewriterule': 10,
          'rlimitcpu': 1,
          'rlimitmem': 1,
          'rlimitnproc': 1,
          'satisfy': 1,
          'scoreboardfile': 1,
          'script': 1,
          'scriptalias': 1,
          'scriptaliasmatch': 1,
          'scriptinterpretersource': 1,
          'scriptlog': 1,
          'scriptlogbuffer': 1,
          'scriptloglength': 1,
          'scriptsock': 1,
          'securelisten': 1,
          'seerequesttail': 1,
          'sendbuffersize': 1,
          'serveradmin': 1,
          'serveralias': 1,
          'serverlimit': 1,
          'servername': 1,
          'serverpath': 1,
          'serverroot': 1,
          'serversignature': 1,
          'servertokens': 1,
          'setenv': 1,
          'setenvif': 1,
          'setenvifnocase': 1,
          'sethandler': 1,
          'setinputfilter': 1,
          'setoutputfilter': 1,
          'ssienableaccess': 1,
          'ssiendtag': 1,
          'ssierrormsg': 1,
          'ssistarttag': 1,
          'ssitimeformat': 1,
          'ssiundefinedecho': 1,
          'sslcacertificatefile': 1,
          'sslcacertificatepath': 1,
          'sslcadnrequestfile': 1,
          'sslcadnrequestpath': 1,
          'sslcarevocationfile': 1,
          'sslcarevocationpath': 1,
          'sslcertificatechainfile': 1,
          'sslcertificatefile': 1,
          'sslcertificatekeyfile': 1,
          'sslciphersuite': 1,
          'sslcryptodevice': 1,
          'sslengine': 1,
          'sslhonorciperorder': 1,
          'sslmutex': 1,
          'ssloptions': 1,
          'sslpassphrasedialog': 1,
          'sslprotocol': 1,
          'sslproxycacertificatefile': 1,
          'sslproxycacertificatepath': 1,
          'sslproxycarevocationfile': 1,
          'sslproxycarevocationpath': 1,
          'sslproxyciphersuite': 1,
          'sslproxyengine': 1,
          'sslproxymachinecertificatefile': 1,
          'sslproxymachinecertificatepath': 1,
          'sslproxyprotocol': 1,
          'sslproxyverify': 1,
          'sslproxyverifydepth': 1,
          'sslrandomseed': 1,
          'sslrequire': 1,
          'sslrequiressl': 1,
          'sslsessioncache': 1,
          'sslsessioncachetimeout': 1,
          'sslusername': 1,
          'sslverifyclient': 1,
          'sslverifydepth': 1,
          'startservers': 1,
          'startthreads': 1,
          'substitute': 1,
          'suexecusergroup': 1,
          'threadlimit': 1,
          'threadsperchild': 1,
          'threadstacksize': 1,
          'timeout': 1,
          'traceenable': 1,
          'transferlog': 1,
          'typesconfig': 1,
          'unsetenv': 1,
          'usecanonicalname': 1,
          'usecanonicalphysicalport': 1,
          'user': 1,
          'userdir': 1,
          'virtualdocumentroot': 1,
          'virtualdocumentrootip': 1,
          'virtualscriptalias': 1,
          'virtualscriptaliasip': 1,
          'win32disableacceptex': 1,
          'xbithack': 1
        },
        'literal': {'on': 1, 'off': 1}
      },
      contains: [
        hljs.HASH_COMMENT_MODE,
        {
          className: 'sqbracket',
          begin: '\\s\\[', end: '\\]$'
        },
        {
          className: 'cbracket',
          begin: '[\\$%]\\{', end: '\\}',
          contains: ['self', NUMBER]
        },
        NUMBER,
        {className: 'tag', begin: '</?', end: '>'},
        hljs.QUOTE_STRING_MODE
      ]
    }
  };
}();
/*
Language: AVR Assembler
Author: Vladimir Ermakov <vooon341@gmail.com>
*/

hljs.LANGUAGES.avrasm =
{
  case_insensitive: true,
  defaultMode: {
    keywords: {
        'keyword': {
          /* mnemonic */
          'adc': 1,  'add': 1 , 'adiw': 1 , 'and': 1 , 'andi': 1 , 'asr': 1 , 'bclr': 1 , 'bld': 1 , 'brbc': 1 , 'brbs': 1 , 'brcc': 1 ,
          'brcs': 1, 'break': 1, 'breq': 1, 'brge': 1, 'brhc': 1, 'brhs': 1, 'brid': 1, 'brie': 1, 'brlo': 1, 'brlt': 1, 'brmi': 1,
          'brne': 1, 'brpl': 1, 'brsh': 1, 'brtc': 1, 'brts': 1, 'brvc': 1, 'brvs': 1, 'bset': 1, 'bst': 1, 'call': 1, 'cbi': 1,
          'cbr': 1, 'clc': 1, 'clh': 1, 'cli': 1, 'cln': 1, 'clr': 1, 'cls': 1, 'clt': 1, 'clv': 1, 'clz': 1, 'com': 1, 'cp': 1,
          'cpc': 1, 'cpi': 1, 'cpse': 1, 'dec': 1, 'eicall': 1, 'eijmp': 1, 'elpm': 1, 'eor': 1, 'fmul': 1, 'fmuls': 1, 'fmulsu': 1,
          'icall': 1, 'ijmp': 1, 'in': 1, 'inc': 1, 'jmp': 1, 'ld': 1, 'ldd': 1, 'ldi': 1, 'lds': 1, 'lpm': 1, 'lsl': 1, 'lsr': 1,
          'mov': 1, 'movw': 1, 'mul': 1, 'muls': 1, 'mulsu': 1, 'neg': 1, 'nop': 1, 'or': 1, 'ori': 1, 'out': 1, 'pop': 1, 'push': 1,
          'rcall': 1, 'ret': 1, 'reti': 1, 'rjmp': 1, 'rol': 1, 'ror': 1, 'sbc': 1, 'sbr': 1, 'sbrc': 1, 'sbrs': 1, 'sec': 1, 'seh': 1,
          'sbi': 1, 'sbci': 1, 'sbic': 1, 'sbis': 1, 'sbiw': 1, 'sei': 1, 'sen': 1, 'ser': 1, 'ses': 1, 'set': 1, 'sev': 1, 'sez': 1,
          'sleep': 1, 'spm': 1, 'st': 1, 'std': 1, 'sts': 1, 'sub': 1, 'subi': 1, 'swap': 1, 'tst': 1, 'wdr': 1
        },
        'built_in': {
          /* general purpose registers */
          'r0': 1, 'r1': 1, 'r2': 1, 'r3': 1, 'r4': 1, 'r5': 1, 'r6': 1, 'r7': 1, 'r8': 1, 'r9': 1, 'r10': 1, 'r11': 1, 'r12': 1,
          'r13': 1, 'r14': 1, 'r15': 1, 'r16': 1, 'r17': 1, 'r18': 1, 'r19': 1,  'r20': 1, 'r21': 1, 'r22': 1, 'r23': 1, 'r24': 1,
          'r25': 1, 'r26': 1, 'r27': 1, 'r28': 1, 'r29': 1, 'r30': 1, 'r31': 1,
          'x': 1 /* R27:R26 */, 'xh': 1 /* R27 */, 'xl': 1 /* R26 */,
          'y': 1 /* R29:R28 */, 'yh': 1 /* R29 */, 'yl': 1 /* R28 */,
          'z': 1 /* R31:R30 */, 'zh': 1 /* R31 */, 'zl': 1 /* R30 */,
          /* IO Registers (ATMega128) */
          'ucsr1c': 1, 'udr1': 1, 'ucsr1a': 1, 'ucsr1b': 1, 'ubrr1l': 1, 'ubrr1h': 1, 'ucsr0c': 1, 'ubrr0h': 1, 'tccr3c': 1,
          'tccr3a': 1, 'tccr3b': 1, 'tcnt3h': 1, 'tcnt3l': 1, 'ocr3ah': 1, 'ocr3al': 1, 'ocr3bh': 1, 'ocr3bl': 1, 'ocr3ch': 1,
          'ocr3cl': 1, 'icr3h': 1, 'icr3l': 1, 'etimsk': 1, 'etifr': 1, 'tccr1c': 1, 'ocr1ch': 1, 'ocr1cl': 1, 'twcr': 1,
          'twdr': 1, 'twar': 1, 'twsr': 1, 'twbr': 1, 'osccal': 1, 'xmcra': 1, 'xmcrb': 1, 'eicra': 1, 'spmcsr': 1, 'spmcr': 1,
          'portg': 1, 'ddrg': 1, 'ping': 1, 'portf': 1, 'ddrf': 1, 'sreg': 1, 'sph': 1, 'spl': 1, 'xdiv': 1, 'rampz': 1,
          'eicrb': 1, 'eimsk': 1, 'gimsk': 1, 'gicr': 1, 'eifr': 1, 'gifr': 1, 'timsk': 1, 'tifr': 1, 'mcucr': 1,
          'mcucsr': 1, 'tccr0': 1, 'tcnt0': 1, 'ocr0': 1, 'assr': 1, 'tccr1a': 1, 'tccr1b': 1, 'tcnt1h': 1, 'tcnt1l': 1,
          'ocr1ah': 1, 'ocr1al': 1, 'ocr1bh': 1, 'ocr1bl': 1, 'icr1h': 1, 'icr1l': 1, 'tccr2': 1, 'tcnt2': 1, 'ocr2': 1,
          'ocdr': 1, 'wdtcr': 1, 'sfior': 1, 'eearh': 1, 'eearl': 1, 'eedr': 1, 'eecr': 1, 'porta': 1, 'ddra': 1, 'pina': 1,
          'portb': 1, 'ddrb': 1, 'pinb': 1, 'portc': 1, 'ddrc': 1, 'pinc': 1, 'portd': 1, 'ddrd': 1, 'pind': 1, 'spdr': 1,
          'spsr': 1, 'spcr': 1, 'udr0': 1, 'ucsr0a': 1, 'ucsr0b': 1, 'ubrr0l': 1, 'acsr': 1, 'admux': 1, 'adcsr': 1, 'adch': 1,
          'adcl': 1, 'porte': 1, 'ddre': 1, 'pine': 1, 'pinf': 1
        }
    },
    contains: [
      hljs.C_BLOCK_COMMENT_MODE,
      {className: 'comment', begin: ';',  end: '$'},
      hljs.C_NUMBER_MODE, // 0x..., decimal, float
      hljs.BINARY_NUMBER_MODE, // 0b...
      {
        className: 'number',
        begin: '\\b(\\$[a-zA-Z0-9]+|0o[0-7]+)' // $..., 0o...
      },
      hljs.QUOTE_STRING_MODE,
      {
        className: 'string',
        begin: '\'', end: '[^\\\\]\'',
        illegal: '[^\\\\][^\']'
      },
      {className: 'label',  begin: '^[A-Za-z0-9_.$]+:'},
      {className: 'preprocessor', begin: '#', end: '$'},
      {  // директивы «.include» «.macro» и т.д.
        className: 'preprocessor',
        begin: '\\.[a-zA-Z]+'
      },
      {  // подстановка в «.macro»
        className: 'localvars',
        begin: '@[0-9]+'
      }
    ]
  }
};

/*
Language: Axapta
Author: Dmitri Roudakov <dmitri@roudakov.ru>
*/

hljs.LANGUAGES.axapta  = {
  defaultMode: {
    keywords: {
      'false': 1, 'int': 1, 'abstract': 1, 'private': 1, 'char': 1, 'interface': 1, 'boolean': 1, 'static': 1,
      'null': 1, 'if': 1, 'for': 1, 'true': 1, 'while': 1, 'long': 1, 'throw': 1,  'finally': 1, 'protected': 1,
      'extends': 1, 'final': 1, 'implements': 1, 'return': 1, 'void': 1, 'enum': 1, 'else': 1, 'break': 1, 'new': 1,
      'catch': 1, 'byte': 1, 'super': 1, 'class': 1, 'case': 1, 'short': 1, 'default': 1, 'double': 1, 'public': 1,
      'try': 1, 'this': 1, 'switch': 1, 'continue': 1, 'reverse': 1, 'firstfast': 1, 'firstonly': 1, 'forupdate': 1,
      'nofetch': 1, 'sum': 1, 'avg': 1, 'minof': 1, 'maxof': 1, 'count': 1, 'order': 1, 'group': 1, 'by': 1, 'asc': 1,
      'desc': 1, 'index': 1, 'hint': 1, 'like': 1, 'dispaly': 1, 'edit': 1, 'client': 1, 'server': 1, 'ttsbegin': 1,
      'ttscommit': 1, 'str': 1, 'real': 1, 'date': 1, 'container': 1, 'anytype': 1, 'common': 1, 'div': 1, 'mod': 1
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.C_NUMBER_MODE,
      {
        className: 'preprocessor',
        begin: '#', end: '$'
      },
      {
        className: 'class',
        begin: '(class |interface )', end: '{',
        illegal: ':',
        keywords: {'class': 1, 'interface': 1},
        contains: [
          {
            className: 'inheritance',
            begin: '(implements|extends)',
            keywords: {'extends': 1, 'implements': 1},
            relevance: 10
          },
          {
            className: 'title',
            begin: hljs.UNDERSCORE_IDENT_RE
          }
        ]
      }
    ]
  }
};
/*
Language: Bash
Author: vah <vahtenberg@gmail.com>
*/

hljs.LANGUAGES.bash = function(){
  var BASH_LITERAL = {'true' : 1, 'false' : 1};
  var VAR1 = {
    className: 'variable',
    begin: '\\$([a-zA-Z0-9_]+)\\b'
  };
  var VAR2 = {
    className: 'variable',
    begin: '\\$\\{(([^}])|(\\\\}))+\\}',
    contains: [hljs.C_NUMBER_MODE]
  };
  var QUOTE_STRING = {
    className: 'string',
    begin: '"', end: '"',
    illegal: '\\n',
    contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2],
    relevance: 0
  };
  var APOS_STRING = {
    className: 'string',
    begin: '\'', end: '\'',
    relevance: 0
  };
  var TEST_CONDITION = {
    className: 'test_condition',
    begin: '', end: '',
    contains: [QUOTE_STRING, APOS_STRING, VAR1, VAR2, hljs.C_NUMBER_MODE],
    keywords: {
      'literal': BASH_LITERAL
    },
    relevance: 0
  };

  return {
    defaultMode: {
      keywords: {
        'keyword': {
          'if' : 1, 'then' : 1, 'else' : 1, 'fi' : 1, 'for' : 1, 'break' : 1, 'continue' : 1, 'while' : 1, 'in' : 1,
          'do' : 1, 'done' : 1, 'echo' : 1, 'exit' : 1, 'return' : 1, 'set' : 1, 'declare' : 1
        },
        'literal': BASH_LITERAL
      },
      contains: [
        {
          className: 'shebang',
          begin: '(#!\\/bin\\/bash)|(#!\\/bin\\/sh)',
          relevance: 10
        },
        VAR1,
        VAR2,
        hljs.HASH_COMMENT_MODE,
        hljs.C_NUMBER_MODE,
        QUOTE_STRING,
        APOS_STRING,
        hljs.inherit(TEST_CONDITION, {begin: '\\[ ', end: ' \\]', relevance: 0}),
        hljs.inherit(TEST_CONDITION, {begin: '\\[\\[ ', end: ' \\]\\]'})
      ]
    }
  };
}();
/*
Language: CMake
Description: CMake is an open-source cross-platform system for build automation.
Author: Igor Kalnitsky <igor.kalnitsky@gmail.com>
Website: http://kalnitsky.org.ua/
*/

hljs.LANGUAGES.cmake = {
  case_insensitive: true,
  defaultMode: {
    keywords: {
      'add_custom_command': 2, 'add_custom_target': 2, 'add_definitions': 2, 'add_dependencies': 2,
      'add_executable': 2, 'add_library': 2, 'add_subdirectory': 2, 'add_test': 2, 'aux_source_directory': 2,
      'break': 1, 'build_command': 2, 'cmake_minimum_required': 3, 'cmake_policy': 3, 'configure_file': 1,
      'create_test_sourcelist': 1, 'define_property': 1, 'else': 1, 'elseif': 1, 'enable_language': 2,
      'enable_testing': 2, 'endforeach': 1, 'endfunction': 1, 'endif': 1, 'endmacro': 1, 'endwhile': 1,
      'execute_process': 2, 'export': 1, 'find_file': 1, 'find_library': 2, 'find_package': 2, 'find_path': 1,
      'find_program': 1, 'fltk_wrap_ui': 2, 'foreach': 1, 'function': 1, 'get_cmake_property': 3,
      'get_directory_property': 1, 'get_filename_component': 1, 'get_property': 1, 'get_source_file_property': 1,
      'get_target_property': 1, 'get_test_property': 1, 'if': 1, 'include': 1, 'include_directories': 2,
      'include_external_msproject': 1, 'include_regular_expression': 2, 'install': 1, 'link_directories': 1,
      'load_cache': 1, 'load_command': 1, 'macro': 1, 'mark_as_advanced': 1, 'message': 1, 'option': 1,
      'output_required_files': 1, 'project': 1, 'qt_wrap_cpp': 2, 'qt_wrap_ui': 2, 'remove_definitions': 2,
      'return': 1, 'separate_arguments': 1, 'set': 1, 'set_directory_properties': 1, 'set_property': 1,
      'set_source_files_properties': 1, 'set_target_properties': 1, 'set_tests_properties': 1, 'site_name': 1,
      'source_group': 1, 'string': 1, 'target_link_libraries': 2, 'try_compile': 2, 'try_run': 2, 'unset': 1,
      'variable_watch': 2, 'while': 1, 'build_name': 1, 'exec_program': 1, 'export_library_dependencies': 1,
      'install_files': 1, 'install_programs': 1, 'install_targets': 1, 'link_libraries': 1, 'make_directory': 1,
      'remove': 1, 'subdir_depends': 1, 'subdirs': 1, 'use_mangled_mesa': 1, 'utility_source': 1,
      'variable_requires': 1, 'write_file': 1
    },
    contains: [
      {
        className: 'envvar',
        begin: '\\${', end: '}'
      },
      hljs.HASH_COMMENT_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.NUMBER_MODE
    ]
  }
};
/*
Language: CoffeeScript
Author: Dmytrii Nagirniak <dnagir@gmail.com>
Contributors: Oleg Efimov <efimovov@gmail.com>
Description: CoffeeScript is a programming language that transcompiles to JavaScript. For info about language see http://coffeescript.org/
*/

hljs.LANGUAGES.coffeescript = function() {
  var keywords = {
    'keyword': {
      // JS keywords
      'in': 1, 'if': 1, 'for': 1, 'while': 1, 'finally': 1,
      'new': 1, 'do': 1, 'return': 1, 'else': 1,
      'break': 1, 'catch': 1, 'instanceof': 1, 'throw': 1,
      'try': 1, 'this': 1, 'switch': 1, 'continue': 1, 'typeof': 1,
      'delete': 1, 'debugger': 1,
      'class': 1, 'extends': 1, 'super': 1,
      // Coffee keywords
      'then': 1, 'unless': 1, 'until': 1, 'loop': 2, 'of': 2, 'by': 1, 'when': 2,
      'and': 1, 'or': 1, 'is': 1, 'isnt': 2, 'not': 1
    },
    'literal': {
      // JS literals
      'true': 1, 'false': 1, 'null': 1, 'undefined': 1,
      // Coffee literals
      'yes': 1, 'no': 1, 'on': 1, 'off': 1
    },
    'reserved': {
      'case': 1, 'default': 1, 'function': 1, 'var': 1, 'void': 1, 'with': 1,
      'const': 1, 'let': 1, 'enum': 1, 'export': 1, 'import': 1, 'native': 1,
      '__hasProp': 1 , '__extends': 1 , '__slice': 1 , '__bind': 1 , '__indexOf': 1
    }
  };

  var JS_IDENT_RE = '[A-Za-z$_][0-9A-Za-z$_]*';

  var COFFEE_QUOTE_STRING_SUBST_MODE = {
    className: 'subst',
    begin: '#\\{', end: '}',
    keywords: keywords,
    contains: [hljs.C_NUMBER_MODE, hljs.BINARY_NUMBER_MODE]
  };

  var COFFEE_QUOTE_STRING_MODE = {
    className: 'string',
    begin: '"', end: '"',
    relevance: 0,
    contains: [hljs.BACKSLASH_ESCAPE, COFFEE_QUOTE_STRING_SUBST_MODE]
  };

  var COFFEE_HEREDOC_MODE = {
    className: 'string',
    begin: '"""', end: '"""',
    contains: [hljs.BACKSLASH_ESCAPE, COFFEE_QUOTE_STRING_SUBST_MODE]
  };

  var COFFEE_HERECOMMENT_MODE = {
    className: 'comment',
    begin: '###', end: '###'
  };

  var COFFEE_HEREGEX_MODE = {
    className: 'regexp',
    begin: '///', end: '///',
    contains: [hljs.HASH_COMMENT_MODE]
  };

  var COFFEE_FUNCTION_DECLARATION_MODE = {
    className: 'function',
    begin: JS_IDENT_RE + '\\s*=\\s*(\\(.+\\))?\\s*[-=]>',
    returnBegin: true,
    contains: [
      {
        className: 'title',
        begin: JS_IDENT_RE
      },
      {
        className: 'params',
        begin: '\\(', end: '\\)'
      }
    ]
  };

  var COFFEE_EMBEDDED_JAVASCRIPT = {
    className: 'javascript',
    begin: '`', end: '`',
    excludeBegin: true, excludeEnd: true,
    subLanguage: 'javascript'
  };

  return {
    defaultMode: {
      keywords: keywords,
      contains: [
        // Numbers 
        hljs.C_NUMBER_MODE,
        hljs.BINARY_NUMBER_MODE,
        // Strings
        hljs.APOS_STRING_MODE,
        COFFEE_HEREDOC_MODE, // Should be before COFFEE_QUOTE_STRING_MODE for greater priority
        COFFEE_QUOTE_STRING_MODE,
        // Comments
        COFFEE_HERECOMMENT_MODE, // Should be before hljs.HASH_COMMENT_MODE for greater priority
        hljs.HASH_COMMENT_MODE,
        // CoffeeScript specific modes
        COFFEE_HEREGEX_MODE,
        COFFEE_EMBEDDED_JAVASCRIPT,
        COFFEE_FUNCTION_DECLARATION_MODE
      ]
    }
  };
}();
/*
Language: C++
Contributors: Evgeny Stepanischev <imbolk@gmail.com>
*/

hljs.LANGUAGES.cpp = function(){
  var CPP_KEYWORDS = {
    'keyword': {
      'false': 1, 'int': 1, 'float': 1, 'while': 1, 'private': 1, 'char': 1,
      'catch': 1, 'export': 1, 'virtual': 1, 'operator': 2, 'sizeof': 2,
      'dynamic_cast': 2, 'typedef': 2, 'const_cast': 2, 'const': 1,
      'struct': 1, 'for': 1, 'static_cast': 2, 'union': 1, 'namespace': 1,
      'unsigned': 1, 'long': 1, 'throw': 1, 'volatile': 2, 'static': 1,
      'protected': 1, 'bool': 1, 'template': 1, 'mutable': 1, 'if': 1,
      'public': 1, 'friend': 2, 'do': 1, 'return': 1, 'goto': 1, 'auto': 1,
      'void': 2, 'enum': 1, 'else': 1, 'break': 1, 'new': 1, 'extern': 1,
      'using': 1, 'true': 1, 'class': 1, 'asm': 1, 'case': 1, 'typeid': 1,
      'short': 1, 'reinterpret_cast': 2, 'default': 1, 'double': 1,
      'register': 1, 'explicit': 1, 'signed': 1, 'typename': 1, 'try': 1,
      'this': 1, 'switch': 1, 'continue': 1, 'wchar_t': 1, 'inline': 1,
      'delete': 1, 'alignof': 1, 'char16_t': 1, 'char32_t': 1, 'constexpr': 1,
      'decltype': 1, 'noexcept': 1, 'nullptr': 1, 'static_assert': 1,
      'thread_local': 1, 'restrict': 1, '_Bool':1, 'complex': 1
    },
    'built_in': {
      'std': 1, 'string': 1, 'cin': 1, 'cout': 1, 'cerr': 1, 'clog': 1,
      'stringstream': 1, 'istringstream': 1, 'ostringstream': 1, 'auto_ptr': 1,
      'deque': 1, 'list': 1, 'queue': 1, 'stack': 1, 'vector': 1, 'map': 1,
      'set': 1, 'bitset': 1, 'multiset': 1, 'multimap': 1, 'unordered_set': 1,
      'unordered_map': 1, 'unordered_multiset': 1, 'unordered_multimap': 1,
      'array': 1, 'shared_ptr': 1
    }
  };
  return {
    defaultMode: {
      keywords: CPP_KEYWORDS,
      illegal: '</',
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.QUOTE_STRING_MODE,
        {
          className: 'string',
          begin: '\'\\\\?.', end: '\'',
          illegal: '.'
        },
        {
          className: 'number',
          begin: '\\b(\\d+(\\.\\d*)?|\\.\\d+)(u|U|l|L|ul|UL|f|F)'
        },
        hljs.C_NUMBER_MODE,
        {
          className: 'preprocessor',
          begin: '#', end: '$'
        },
        {
          className: 'stl_container',
          begin: '\\b(deque|list|queue|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array)\\s*<', end: '>',
          keywords: CPP_KEYWORDS,
          relevance: 10,
          contains: ['self']
        }
      ]
    }
  };
}();
/*
Language: C#
Author: Jason Diamond <jason@diamond.name>
*/

hljs.LANGUAGES.cs  = {
  defaultMode: {
    keywords: {
      // Normal keywords.
      'abstract': 1, 'as': 1, 'base': 1, 'bool': 1, 'break': 1, 'byte': 1, 'case': 1, 'catch': 1, 'char': 1,
      'checked': 1, 'class': 1, 'const': 1, 'continue': 1, 'decimal': 1, 'default': 1, 'delegate': 1, 'do': 1,
      'double': 1, 'else': 1, 'enum': 1, 'event': 1, 'explicit': 1, 'extern': 1, 'false': 1, 'finally': 1, 'fixed': 1,
      'float': 1, 'for': 1, 'foreach': 1, 'goto': 1, 'if': 1, 'implicit': 1, 'in': 1, 'int': 1, 'interface': 1,
      'internal': 1, 'is': 1, 'lock': 1, 'long': 1, 'namespace': 1, 'new': 1, 'null': 1, 'object': 1, 'operator': 1,
      'out': 1, 'override': 1, 'params': 1, 'private': 1, 'protected': 1, 'public': 1, 'readonly': 1, 'ref': 1,
      'return': 1, 'sbyte': 1, 'sealed': 1, 'short': 1, 'sizeof': 1, 'stackalloc': 1, 'static': 1, 'string': 1,
      'struct': 1, 'switch': 1, 'this': 1, 'throw': 1, 'true': 1, 'try': 1, 'typeof': 1, 'uint': 1, 'ulong': 1,
      'unchecked': 1, 'unsafe': 1, 'ushort': 1, 'using': 1, 'virtual': 1, 'volatile': 1, 'void': 1, 'while': 1,
      // Contextual keywords.
      'ascending': 1, 'descending': 1, 'from': 1, 'get': 1, 'group': 1, 'into': 1, 'join': 1, 'let': 1, 'orderby': 1,
      'partial': 1, 'select': 1, 'set': 1, 'value': 1, 'var': 1, 'where': 1, 'yield': 1
    },
    contains: [
      {
        className: 'comment',
        begin: '///', end: '$', returnBegin: true,
        contains: [
          {
            className: 'xmlDocTag',
            begin: '///|<!--|-->'
          },
          {
            className: 'xmlDocTag',
            begin: '</?', end: '>'
          }
        ]
      },
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: 'preprocessor',
        begin: '#', end: '$',
        keywords: {
          'if': 1, 'else': 1, 'elif': 1, 'endif': 1, 'define': 1, 'undef': 1, 'warning': 1,
          'error': 1, 'line': 1, 'region': 1, 'endregion': 1, 'pragma': 1, 'checksum': 1
        }
      },
      {
        className: 'string',
        begin: '@"', end: '"',
        contains: [{begin: '""'}]
      },
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.C_NUMBER_MODE
    ]
  }
};
/*
Language: CSS
*/

hljs.LANGUAGES.css = function() {
  var FUNCTION = {
    className: 'function',
    begin: hljs.IDENT_RE + '\\(', end: '\\)',
    contains: [{
        endsWithParent: true, excludeEnd: true,
        contains: [hljs.NUMBER_MODE, hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE]
    }]
  };
  return {
    case_insensitive: true,
    defaultMode: {
      illegal: '[=/|\']',
      contains: [
        hljs.C_BLOCK_COMMENT_MODE,
        {
          className: 'id', begin: '\\#[A-Za-z0-9_-]+'
        },
        {
          className: 'class', begin: '\\.[A-Za-z0-9_-]+',
          relevance: 0
        },
        {
          className: 'attr_selector',
          begin: '\\[', end: '\\]',
          illegal: '$'
        },
        {
          className: 'pseudo',
          begin: ':(:)?[a-zA-Z0-9\\_\\-\\+\\(\\)\\"\\\']+'
        },
        {
          className: 'at_rule',
          begin: '@(font-face|page)',
          lexems: '[a-z-]+',
          keywords: {'font-face': 1, 'page': 1}
        },
        {
          className: 'at_rule',
          begin: '@', end: '[{;]', // at_rule eating first "{" is a good thing
                                   // because it doesn't let it to be parsed as
                                   // a rule set but instead drops parser into
                                   // the defaultMode which is how it should be.
          excludeEnd: true,
          keywords: {'import': 1, 'page': 1, 'media': 1, 'charset': 1},
          contains: [
            FUNCTION,
            hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE,
            hljs.NUMBER_MODE
          ]
        },
        {
          className: 'tag', begin: hljs.IDENT_RE,
          relevance: 0
        },
        {
          className: 'rules',
          begin: '{', end: '}',
          illegal: '[^\\s]',
          relevance: 0,
          contains: [
            hljs.C_BLOCK_COMMENT_MODE,
            {
              className: 'rule',
              begin: '[^\\s]', returnBegin: true, end: ';', endsWithParent: true,
              contains: [
                {
                  className: 'attribute',
                  begin: '[A-Z\\_\\.\\-]+', end: ':',
                  excludeEnd: true,
                  illegal: '[^\\s]',
                  starts: {
                    className: 'value',
                    endsWithParent: true, excludeEnd: true,
                    contains: [
                      FUNCTION,
                      hljs.NUMBER_MODE,
                      hljs.QUOTE_STRING_MODE,
                      hljs.APOS_STRING_MODE,
                      hljs.C_BLOCK_COMMENT_MODE,
                      {
                        className: 'hexcolor', begin: '\\#[0-9A-F]+'
                      },
                      {
                        className: 'important', begin: '!important'
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  };
}();
/*
Language: Delphi
*/

hljs.LANGUAGES.delphi = function(){
  var DELPHI_KEYWORDS = {
    'and': 1, 'safecall': 1, 'cdecl': 1, 'then': 1, 'string': 1, 'exports': 1, 'library': 1, 'not': 1, 'pascal': 1,
    'set': 1, 'virtual': 1, 'file': 1, 'in': 1, 'array': 1, 'label': 1, 'packed': 1, 'end.': 1, 'index': 1,
    'while': 1, 'const': 1, 'raise': 1, 'for': 1, 'to': 1, 'implementation': 1, 'with': 1, 'except': 1,
    'overload': 1, 'destructor': 1, 'downto': 1, 'finally': 1, 'program': 1, 'exit': 1, 'unit': 1, 'inherited': 1,
    'override': 1, 'if': 1, 'type': 1, 'until': 1, 'function': 1, 'do': 1, 'begin': 1, 'repeat': 1, 'goto': 1,
    'nil': 1, 'far': 1, 'initialization': 1, 'object': 1, 'else': 1, 'var': 1, 'uses': 1, 'external': 1,
    'resourcestring': 1, 'interface': 1, 'end': 1, 'finalization': 1, 'class': 1, 'asm': 1, 'mod': 1, 'case': 1,
    'on': 1, 'shr': 1, 'shl': 1, 'of': 1, 'register': 1, 'xorwrite': 1, 'threadvar': 1, 'try': 1, 'record': 1,
    'near': 1, 'stored': 1, 'constructor': 1, 'stdcall': 1, 'inline': 1, 'div': 1, 'out': 1, 'or': 1, 'procedure': 1
  };
  var DELPHI_CLASS_KEYWORDS = {
    'safecall': 1, 'stdcall': 1, 'pascal': 1, 'stored': 1, 'const': 1, 'implementation': 1, 'finalization': 1,
    'except': 1, 'to': 1, 'finally': 1, 'program': 1, 'inherited': 1, 'override': 1, 'then': 1, 'exports': 1,
    'string': 1, 'read': 1, 'not': 1, 'mod': 1, 'shr': 1, 'try': 1, 'div': 1, 'shl': 1, 'set': 1, 'library': 1,
    'message': 1, 'packed': 1, 'index': 1, 'for': 1, 'near': 1, 'overload': 1, 'label': 1, 'downto': 1, 'exit': 1,
    'public': 1, 'goto': 1, 'interface': 1, 'asm': 1, 'on': 1, 'of': 1, 'constructor': 1, 'or': 1, 'private': 1,
    'array': 1, 'unit': 1, 'raise': 1, 'destructor': 1, 'var': 1, 'type': 1, 'until': 1, 'function': 1, 'else': 1,
    'external': 1, 'with': 1, 'case': 1, 'default': 1, 'record': 1, 'while': 1, 'protected': 1, 'property': 1,
    'procedure': 1, 'published': 1, 'and': 1, 'cdecl': 1, 'do': 1, 'threadvar': 1, 'file': 1, 'in': 1, 'if': 1,
    'end': 1, 'virtual': 1, 'write': 1, 'far': 1, 'out': 1, 'begin': 1, 'repeat': 1, 'nil': 1, 'initialization': 1,
    'object': 1, 'uses': 1, 'resourcestring': 1, 'class': 1, 'register': 1, 'xorwrite': 1, 'inline': 1, 'static': 1
  };
  var CURLY_COMMENT =  {
    className: 'comment',
    begin: '{', end: '}',
    relevance: 0
  };
  var PAREN_COMMENT = {
    className: 'comment',
    begin: '\\(\\*', end: '\\*\\)',
    relevance: 10
  };
  var STRING = {
    className: 'string',
    begin: '\'', end: '\'',
    contains: [{begin: '\'\''}],
    relevance: 0
  };
  var CHAR_STRING = {
    className: 'string', begin: '(#\\d+)+'
  };
  var FUNCTION = {
    className: 'function',
    begin: '(procedure|constructor|destructor|function)\\b', end: '[:;]',
    keywords: {'function': 1, 'constructor': 10, 'destructor': 10, 'procedure': 10},
    contains: [
      {
        className: 'title', begin: hljs.IDENT_RE
      },
      {
        className: 'params',
        begin: '\\(', end: '\\)',
        keywords: DELPHI_KEYWORDS,
        contains: [STRING, CHAR_STRING]
      },
      CURLY_COMMENT, PAREN_COMMENT
    ]
  };
  return {
    case_insensitive: true,
    defaultMode: {
      keywords: DELPHI_KEYWORDS,
      illegal: '("|\\$[G-Zg-z]|\\/\\*|</)',
      contains: [
        CURLY_COMMENT, PAREN_COMMENT, hljs.C_LINE_COMMENT_MODE,
        STRING, CHAR_STRING,
        hljs.NUMBER_MODE,
        FUNCTION,
        {
          className: 'class',
          begin: '=\\bclass\\b', end: 'end;',
          keywords: DELPHI_CLASS_KEYWORDS,
          contains: [
            STRING, CHAR_STRING,
            CURLY_COMMENT, PAREN_COMMENT, hljs.C_LINE_COMMENT_MODE,
            FUNCTION
          ]
        }
      ]
    }
  };
}();
/*
Language: Diff
Description: Unified and context diff
Author: Vasily Polovnyov <vast@whiteants.net>
*/

hljs.LANGUAGES.diff = {
  case_insensitive: true,
  defaultMode: {
    contains: [
      {
        className: 'chunk',
        begin: '^\\@\\@ +\\-\\d+,\\d+ +\\+\\d+,\\d+ +\\@\\@$',
        relevance: 10
      },
      {
        className: 'chunk',
        begin: '^\\*\\*\\* +\\d+,\\d+ +\\*\\*\\*\\*$',
        relevance: 10
      },
      {
        className: 'chunk',
        begin: '^\\-\\-\\- +\\d+,\\d+ +\\-\\-\\-\\-$',
        relevance: 10
      },
      {
        className: 'header',
        begin: 'Index: ', end: '$'
      },
      {
        className: 'header',
        begin: '=====', end: '=====$'
      },
      {
        className: 'header',
        begin: '^\\-\\-\\-', end: '$'
      },
      {
        className: 'header',
        begin: '^\\*{3} ', end: '$'
      },
      {
        className: 'header',
        begin: '^\\+\\+\\+', end: '$'
      },
      {
        className: 'header',
        begin: '\\*{5}', end: '\\*{5}$'
      },
      {
        className: 'addition',
        begin: '^\\+', end: '$'
      },
      {
        className: 'deletion',
        begin: '^\\-', end: '$'
      },
      {
        className: 'change',
        begin: '^\\!', end: '$'
      }
    ]
  }
};
/*
Language: Django
Requires: xml.js
*/

hljs.LANGUAGES.django = function() {

  function allowsDjangoSyntax(mode, parent) {
    return (
      parent == undefined || // defaultMode
      (!mode.className && parent.className == 'tag') || // tag_internal
      mode.className == 'value' // value
    );
  }

  function copy(mode, parent) {
    var result = {};
    for (var key in mode) {
      if (key != 'contains') {
        result[key] = mode[key];
      }
      var contains = [];
      for (var i = 0; mode.contains && i < mode.contains.length; i++) {
        contains.push(copy(mode.contains[i], mode));
      }
      if (allowsDjangoSyntax(mode, parent)) {
        contains = DJANGO_CONTAINS.concat(contains);
      }
      if (contains.length) {
        result.contains = contains;
      }
    }
    return result;
  }

  var FILTER = {
    className: 'filter',
    begin: '\\|[A-Za-z]+\\:?', excludeEnd: true,
    keywords: {
      'truncatewords': 1, 'removetags': 1, 'linebreaksbr': 1, 'yesno': 1, 'get_digit': 1, 'timesince': 1, 'random': 1,
      'striptags': 1, 'filesizeformat': 1, 'escape': 1, 'linebreaks': 1, 'length_is': 1, 'ljust': 1, 'rjust': 1,
      'cut': 1, 'urlize': 1, 'fix_ampersands': 1, 'title': 1, 'floatformat': 1, 'capfirst': 1, 'pprint': 1,
      'divisibleby': 1, 'add': 1, 'make_list': 1, 'unordered_list': 1, 'urlencode': 1, 'timeuntil': 1,
      'urlizetrunc': 1, 'wordcount': 1, 'stringformat': 1, 'linenumbers': 1, 'slice': 1, 'date': 1, 'dictsort': 1,
      'dictsortreversed': 1, 'default_if_none': 1, 'pluralize': 1, 'lower': 1, 'join': 1, 'center': 1, 'default': 1,
      'truncatewords_html': 1, 'upper': 1, 'length': 1, 'phone2numeric': 1, 'wordwrap': 1, 'time': 1, 'addslashes': 1,
      'slugify': 1, 'first': 1
    },
    contains: [
      {className: 'argument', begin: '"', end: '"'}
    ]
  };

  var DJANGO_CONTAINS = [
    {
      className: 'template_comment',
      begin: '{%\\s*comment\\s*%}', end: '{%\\s*endcomment\\s*%}'
    },
    {
      className: 'template_comment',
      begin: '{#', end: '#}'
    },
    {
      className: 'template_tag',
      begin: '{%', end: '%}',
      keywords: {'comment': 1, 'endcomment': 1, 'load': 1, 'templatetag': 1, 'ifchanged': 1, 'endifchanged': 1, 'if': 1, 'endif': 1, 'firstof': 1, 'for': 1, 'endfor': 1, 'in': 1, 'ifnotequal': 1, 'endifnotequal': 1, 'widthratio': 1, 'extends': 1, 'include': 1, 'spaceless': 1, 'endspaceless': 1, 'regroup': 1, 'by': 1, 'as': 1, 'ifequal': 1, 'endifequal': 1, 'ssi': 1, 'now': 1, 'with': 1, 'cycle': 1, 'url': 1, 'filter': 1, 'endfilter': 1, 'debug': 1, 'block': 1, 'endblock': 1, 'else': 1},
      contains: [FILTER]
    },
    {
      className: 'variable',
      begin: '{{', end: '}}',
      contains: [FILTER]
    }
  ];

  return {
    case_insensitive: true,
    defaultMode: copy(hljs.LANGUAGES.xml.defaultMode)
  };

}();
/*
Language: DOS .bat
Author: Alexander Makarov (http://rmcreative.ru/)
*/

hljs.LANGUAGES.dos = {
  case_insensitive: true,
  defaultMode: {
    keywords: {
      'flow': {'if':1, 'else':1, 'goto':1, 'for':1, 'in':1, 'do':1, 'call':1, 'exit':1, 'not':1, 'exist':1, 'errorlevel':1, 'defined':1, 'equ':1, 'neq':1, 'lss':1, 'leq':1, 'gtr':1, 'geq':1},
      'keyword':{'shift':1, 'cd':1, 'dir':1, 'echo':1, 'setlocal':1, 'endlocal':1, 'set':1, 'pause':1, 'copy':1},
      'stream':{'prn':1, 'nul':1, 'lpt3':1, 'lpt2':1, 'lpt1':1, 'con':1, 'com4':1, 'com3':1, 'com2':1, 'com1':1, 'aux':1},
      'winutils':{'ping':1, 'net':1, 'ipconfig':1, 'taskkill':1, 'xcopy':1, 'ren':1, 'del':1}
    },
    contains: [
      {
        className: 'envvar', begin: '%%[^ ]'
      },
      {
        className: 'envvar', begin: '%[^ ]+?%'
      },
      {
        className: 'envvar', begin: '![^ ]+?!'
      },
      {
        className: 'number', begin: '\\b\\d+',
        relevance: 0
      },
      {
        className: 'comment',
        begin: '@?rem', end: '$'
      }
    ]
  }
};
/*
Language: Erlang
Description: Erlang is a general-purpose functional language, with strict evaluation, single assignment, and dynamic typing.
Author: Nikolay Zakharov <nikolay.desh@gmail.com>, Dmitry Kovega <arhibot@gmail.com>
*/

hljs.LANGUAGES.erlang = function(){
  var BASIC_ATOM_RE = '[a-z\'][a-zA-Z0-9_\']*';
  var FUNCTION_NAME_RE = '(' + BASIC_ATOM_RE + ':' + BASIC_ATOM_RE + '|' + BASIC_ATOM_RE + ')';
  var ERLANG_RESERVED = {
    'keyword': {
        'after': 1,
        'and': 1,
        'andalso': 10,
        'band': 1,
        'begin': 1,
        'bnot': 1,
        'bor': 1,
        'bsl': 1,
        'bzr': 1,
        'bxor': 1,
        'case': 1,
        'catch': 1,
        'cond': 1,
        'div': 1,
        'end': 1,
        'fun': 1,
        'let': 1,
        'not': 1,
        'of': 1,
        'orelse': 10,
        'query': 1,
        'receive': 1,
        'rem': 1,
        'try': 1,
        'when': 1,
        'xor': 1
    },
    'literal': {'false': 1, 'true': 1}
  };

  var COMMENT = {
    className: 'comment',
    begin: '%', end: '$',
    relevance: 0
  };
  var NUMBER = {
    className: 'number',
    begin: '\\b(\\d+#[a-fA-F0-9]+|\\d+(\\.\\d+)?([eE][-+]?\\d+)?)',
    relevance: 0
  };
  var NAMED_FUN = {
    begin: 'fun\\s+' + BASIC_ATOM_RE + '/\\d+'
  };
  var FUNCTION_CALL = {
    begin: FUNCTION_NAME_RE + '\\(', end: '\\)',
    returnBegin: true,
    relevance: 0,
    contains: [
      {
        className: 'function_name', begin: FUNCTION_NAME_RE,
        relevance: 0
      },
      {
        begin: '\\(', end: '\\)', endsWithParent: true,
        returnEnd: true,
        relevance: 0
        // "contains" defined later
      }
    ]
  };
  var TUPLE = {
    className: 'tuple',
    begin: '{', end: '}',
    relevance: 0
    // "contains" defined later
  };
  var VAR1 = {
    className: 'variable',
    begin: '\\b_([A-Z][A-Za-z0-9_]*)?',
    relevance: 0
  };
  var VAR2 = {
    className: 'variable',
    begin: '[A-Z][a-zA-Z0-9_]*',
    relevance: 0
  };
  var RECORD_ACCESS = {
    begin: '#', end: '}',
    illegal: '.',
    relevance: 0,
    returnBegin: true,
    contains: [
      {
        className: 'record_name',
        begin: '#' + hljs.UNDERSCORE_IDENT_RE,
        relevance: 0
      },
      {
        begin: '{', endsWithParent: true,
        relevance: 0
        // "contains" defined later
      }
    ]
  };

  var BLOCK_STATEMENTS = {
    keywords: ERLANG_RESERVED,
    begin: '(fun|receive|if|try|case)', end: 'end'
  };
  BLOCK_STATEMENTS.contains = [
    COMMENT,
    NAMED_FUN,
    hljs.inherit(hljs.APOS_STRING_MODE, {className: ''}),
    BLOCK_STATEMENTS,
    FUNCTION_CALL,
    hljs.QUOTE_STRING_MODE,
    NUMBER,
    TUPLE,
    VAR1, VAR2,
    RECORD_ACCESS
  ];

  var BASIC_MODES = [
    COMMENT,
    NAMED_FUN,
    BLOCK_STATEMENTS,
    FUNCTION_CALL,
    hljs.QUOTE_STRING_MODE,
    NUMBER,
    TUPLE,
    VAR1, VAR2,
    RECORD_ACCESS
  ];
  FUNCTION_CALL.contains[1].contains = BASIC_MODES;
  TUPLE.contains = BASIC_MODES;
  RECORD_ACCESS.contains[1].contains = BASIC_MODES;

  var PARAMS = {
    className: 'params',
    begin: '\\(', end: '\\)',
    endsWithParent: true,
    contains: BASIC_MODES
  };
  return {
    defaultMode: {
      keywords: ERLANG_RESERVED,
      illegal: '(</|\\*=|\\+=|-=|/=|/\\*|\\*/|\\(\\*|\\*\\))',
      contains: [
        {
          className: 'function',
          begin: '^' + BASIC_ATOM_RE + '\\(', end: ';|\\.',
          returnBegin: true,
          contains: [
            PARAMS,
            {
              className: 'title', begin: BASIC_ATOM_RE
            },
            {
              keywords: ERLANG_RESERVED,
              begin: '->', endsWithParent: true,
              contains: BASIC_MODES
            }
          ]
        },
        COMMENT,
        {
          className: 'pp',
          begin: '^-', end: '\\.',
          relevance: 0,
          excludeEnd: true,
          returnBegin: true,
          lexems: '-' + hljs.IDENT_RE,
          keywords: {
            '-module':1,
            '-record':1,
            '-undef':1,
            '-export':1,
            '-ifdef':1,
            '-ifndef':1,
            '-author':1,
            '-copyright':1,
            '-doc':1,
            '-vsn':1,
            '-import': 1,
            '-include': 1,
            '-include_lib': 1,
            '-compile': 1,
            '-define': 1,
            '-else': 1,
            '-endif': 1,
            '-file': 1,
            '-behaviour': 1,
            '-behavior': 1
          },
          contains: [PARAMS]
        },
        NUMBER,
        hljs.QUOTE_STRING_MODE,
        RECORD_ACCESS,
        VAR1, VAR2,
        TUPLE
      ]
    }
  };
}();
/*
 Language: Erlang REPL
 Author: Sergey Ignatov <sergey@ignatov.spb.su>
 */

hljs.LANGUAGES.erlang_repl = {
  defaultMode: {
    keywords: {
      'special_functions':{
        'spawn':10,
        'spawn_link':10,
        'self':2
      },
      'reserved':{
        'after':1,
        'and':1,
        'andalso':5,
        'band':1,
        'begin':1,
        'bnot':1,
        'bor':1,
        'bsl':1,
        'bsr':1,
        'bxor':1,
        'case':1,
        'catch':0,
        'cond':1,
        'div':1,
        'end':1,
        'fun':0,
        'if':0,
        'let':1,
        'not':0,
        'of':1,
        'or':1,
        'orelse':5,
        'query':1,
        'receive':0,
        'rem':1,
        'try':0,
        'when':1,
        'xor':1
      }
    },
    contains: [
      {
        className: 'input_number', begin: '^[0-9]+> ',
        relevance: 10
      },
      {
        className: 'comment',
        begin: '%', end: '$'
      },
      {
        className: 'number',
        begin: '\\b(\\d+#[a-fA-F0-9]+|\\d+(\\.\\d+)?([eE][-+]?\\d+)?)',
        relevance: 0
      },
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      {
        className: 'constant', begin: '\\?(::)?([A-Z]\\w*(::)?)+'
      },
      {
        className: 'arrow', begin: '->'
      },
      {
        className: 'ok', begin: 'ok'
      },
      {
        className: 'exclamation_mark', begin: '!'
      },
      {
        className: 'function_or_atom',
        begin: '(\\b[a-z\'][a-zA-Z0-9_\']*:[a-z\'][a-zA-Z0-9_\']*)|(\\b[a-z\'][a-zA-Z0-9_\']*)',
        relevance: 0
      },
      {
        className: 'variable',
        begin: '[A-Z][a-zA-Z0-9_\']*',
        relevance: 0
      }
    ]
  }
};
/*
Language: Go
Author: Stephan Kountso aka StepLg <steplg@gmail.com>
Contributors: Evgeny Stepanischev <imbolk@gmail.com>
Description: Google go language (golang). For info about language see http://golang.org/
*/

hljs.LANGUAGES.go = function(){
  var GO_KEYWORDS = {
    'keyword': {
       'break' : 1, 'default' : 1, 'func' : 1, 'interface' : 1, 'select' : 1,
       'case' : 1, 'map' : 1, 'struct' : 1, 'chan' : 1,
       'else' : 1, 'goto' : 1, 'package' : 1, 'switch' : 1, 'const' : 1,
       'fallthrough' : 1, 'if' : 1, 'range' : 1, 'type' : 1, 'continue' : 1,
       'for' : 1, 'import' : 1, 'return' : 1, 'var' : 1, 'go': 1, 'defer' : 1
    },
    'constant': {
       'true': 1, 'false': 1, 'iota': 1, 'nil': 1
    },
    'typename': {
       'bool': 1, 'byte': 1, 'complex64': 1, 'complex128': 1, 'float32': 1,
       'float64': 1, 'int8': 1, 'int16': 1, 'int32': 1, 'int64': 1, 'string': 1,
       'uint8': 1, 'uint16': 1, 'uint32': 1, 'uint64': 1, 'int': 1, 'uint': 1,
       'uintptr': 1, 'rune': 1
   },
    'built_in': {
       'append': 1, 'cap': 1, 'close': 1, 'complex': 1, 'copy': 1, 'imag': 1,
       'len': 1, 'make': 1, 'new': 1, 'panic': 1, 'print': 1, 'println': 1,
       'real': 1, 'recover': 1, 'delete': 1
    }
  };
  return {
    defaultMode: {
      keywords: GO_KEYWORDS,
      illegal: '</',
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.QUOTE_STRING_MODE,
        {
          className: 'string',
          begin: '\'', end: '[^\\\\]\'',
          relevance: 0
        },
        {
          className: 'string',
          begin: '`', end: '`'
        },
        {
          className: 'number',
          begin: '[^a-zA-Z_0-9](\\-|\\+)?\\d+(\\.\\d+|\\/\\d+)?((d|e|f|l|s)(\\+|\\-)?\\d+)?',
          relevance: 0
        },
        hljs.C_NUMBER_MODE
      ]
    }
  };
}();

/*
Language: Haskell
Author: Jeremy Hull <sourdrums@gmail.com>
*/

hljs.LANGUAGES.haskell = function(){
  var LABEL = {
    className: 'label',
    begin: '\\b[A-Z][\\w\']*',
    relevance: 0
  };
  var CONTAINER = {
    className: 'container',
    begin: '\\(', end: '\\)',
    contains: [
      {className: 'label', begin: '\\b[A-Z][\\w\\(\\)\\.\']*'},
      {className: 'title', begin: '[_a-z][\\w\']*'}
    ]
  };

  return {
    defaultMode: {
      keywords: {
        'keyword': {
          'let': 1, 'in': 1, 'if': 1, 'then': 1, 'else': 1, 'case': 1, 'of': 1,
          'where': 1, 'do': 1, 'module': 1, 'import': 1, 'hiding': 1,
          'qualified': 1, 'type': 1, 'data': 1, 'newtype': 1, 'deriving': 1,
          'class': 1, 'instance': 1, 'null': 1, 'not': 1, 'as': 1
        }
      },
      contains: [
        {
          className: 'comment',
          begin: '--', end: '$'
        },
        {
          className: 'comment',
          begin: '{-', end: '-}'
        },
        {
          className: 'string',
          begin: '\\s+\'', end: '\'',
          contains: [hljs.BACKSLASH_ESCAPE],
          relevance: 0
        },
        hljs.QUOTE_STRING_MODE,
        {
          className: 'import',
          begin: '\\bimport', end: '$',
          keywords: {'import': 1, 'qualified': 1, 'as': 1, 'hiding': 1},
          contains: [CONTAINER]
        },
        {
          className: 'module',
          begin: '\\bmodule', end: 'where',
          keywords: {'module': 1, 'where': 1},
          contains: [CONTAINER]
        },
        {
          className: 'class',
          begin: '\\b(class|instance|data|(new)?type)', end: '(where|$)',
          keywords: {'class': 1, 'where': 1, 'instance': 1,'data': 1,'type': 1,'newtype': 1, 'deriving': 1},
          contains: [LABEL]
        },
        hljs.C_NUMBER_MODE,
        {
          className: 'shebang',
          begin: '#!\\/usr\\/bin\\/env\ runhaskell', end: '$'
        },
        LABEL,
        {
          className: 'title', begin: '^[_a-z][\\w\']*'
        }
      ]
    }
  };
}();
/*
Language: Ini
*/

hljs.LANGUAGES.ini = {
  case_insensitive: true,
  defaultMode: {
    illegal: '[^\\s]',
    contains: [
      {
        className: 'comment',
        begin: ';', end: '$'
      },
      {
        className: 'title',
        begin: '^\\[', end: '\\]'
      },
      {
        className: 'setting',
        begin: '^[a-z0-9_\\[\\]]+[ \\t]*=[ \\t]*', end: '$',
        contains: [
          {
            className: 'value',
            endsWithParent: true,
            keywords: {'on': 1, 'off': 1, 'true': 1, 'false': 1, 'yes': 1, 'no': 1},
            contains: [hljs.QUOTE_STRING_MODE, hljs.NUMBER_MODE]
          }
        ]
      }
    ]
  }
};
/*
Language: Java
Author: Vsevolod Solovyov <vsevolod.solovyov@gmail.com>
*/

hljs.LANGUAGES.java  = {
  defaultMode: {
    keywords: {
      'false': 1, 'synchronized': 1, 'int': 1, 'abstract': 1, 'float': 1, 'private': 1, 'char': 1, 'interface': 1,
      'boolean': 1, 'static': 1, 'null': 1, 'if': 1, 'const': 1, 'for': 1, 'true': 1, 'while': 1, 'long': 1,
      'throw': 1, 'strictfp': 1, 'finally': 1, 'protected': 1, 'extends': 1, 'import': 1, 'native': 1, 'final': 1,
      'implements': 1, 'return': 1, 'void': 1, 'enum': 1, 'else': 1, 'break': 1, 'transient': 1, 'new': 1, 'catch': 1,
      'instanceof': 1, 'byte': 1, 'super': 1, 'class': 1, 'volatile': 1, 'case': 1, 'assert': 1, 'short': 1,
      'package': 1, 'default': 1, 'double': 1, 'public': 1, 'try': 1, 'this': 1, 'switch': 1, 'continue': 1,
      'throws': 1
    },
    contains: [
      {
        className: 'javadoc',
        begin: '/\\*\\*', end: '\\*/',
        contains: [{
          className: 'javadoctag', begin: '@[A-Za-z]+'
        }],
        relevance: 10
      },
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      {
        className: 'class',
        begin: '(class |interface )', end: '{',
        keywords: {'class': 1, 'interface': 1},
        illegal: ':',
        contains: [
          {
            begin: '(implements|extends)',
            keywords: {'extends': 1, 'implements': 1},
            relevance: 10
          },
          {
            className: 'title',
            begin: hljs.UNDERSCORE_IDENT_RE
          }
        ]
      },
      hljs.C_NUMBER_MODE,
      {
        className: 'annotation', begin: '@[A-Za-z]+'
      }
    ]
  }
};
/*
Language: JavaScript
*/

hljs.LANGUAGES.javascript = {
  defaultMode: {
    keywords: {
      'keyword': {
        'in': 1, 'if': 1, 'for': 1, 'while': 1, 'finally': 1, 'var': 1, 'new': 1, 'function': 1, 'do': 1,
        'return': 1, 'void': 1, 'else': 1, 'break': 1, 'catch': 1, 'instanceof': 1, 'with': 1, 'throw': 1,
        'case': 1, 'default': 1, 'try': 1, 'this': 1, 'switch': 1, 'continue': 1, 'typeof': 1, 'delete': 1
      },
      'literal': {'true': 1, 'false': 1, 'null': 1}
    },
    contains: [
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.C_NUMBER_MODE,
      { // regexp container
        begin: '(' + hljs.RE_STARTERS_RE + '|case|return|throw)\\s*',
        keywords: {'return': 1, 'throw': 1, 'case': 1},
        contains: [
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          {
            className: 'regexp',
            begin: '/', end: '/[gim]*',
            contains: [{begin: '\\\\/'}]
          }
        ],
        relevance: 0
      },
      {
        className: 'function',
        begin: '\\bfunction\\b', end: '{',
        keywords: {'function': 1},
        contains: [
          {
            className: 'title', begin: '[A-Za-z$_][0-9A-Za-z$_]*'
          },
          {
            className: 'params',
            begin: '\\(', end: '\\)',
            contains: [
              hljs.APOS_STRING_MODE,
              hljs.QUOTE_STRING_MODE,
              hljs.C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE
            ]
          }
        ]
      }
    ]
  }
};
/*
Language: Lisp
Description: Generic lisp syntax
Author: Vasily Polovnyov <vast@whiteants.net>
*/

hljs.LANGUAGES.lisp = function(){
  var LISP_IDENT_RE = '[a-zA-Z_\\-\\+\\*\\/\\<\\=\\>\\&\\#][a-zA-Z0-9_\\-\\+\\*\\/\\<\\=\\>\\&\\#]*';
  var LISP_SIMPLE_NUMBER_RE = '(\\-|\\+)?\\d+(\\.\\d+|\\/\\d+)?((d|e|f|l|s)(\\+|\\-)?\\d+)?';
  var LITERAL = {
    className: 'literal',
    begin: '\\b(t{1}|nil)\\b'
  };
  var NUMBERS = [
    {
      className: 'number', begin: LISP_SIMPLE_NUMBER_RE
    },
    {
      className: 'number', begin: '#b[0-1]+(/[0-1]+)?'
    },
    {
      className: 'number', begin: '#o[0-7]+(/[0-7]+)?'
    },
    {
      className: 'number', begin: '#x[0-9a-f]+(/[0-9a-f]+)?'
    },
    {
      className: 'number', begin: '#c\\(' + LISP_SIMPLE_NUMBER_RE + ' +' + LISP_SIMPLE_NUMBER_RE, end: '\\)'
    }
  ]
  var STRING = {
    className: 'string',
    begin: '"', end: '"',
    contains: [hljs.BACKSLASH_ESCAPE],
    relevance: 0
  };
  var COMMENT = {
    className: 'comment',
    begin: ';', end: '$'
  };
  var VARIABLE = {
    className: 'variable',
    begin: '\\*', end: '\\*'
  };
  var KEYWORD = {
    className: 'keyword',
    begin: '[:&]' + LISP_IDENT_RE
  };
  var QUOTED_LIST = {
    begin: '\\(', end: '\\)',
    contains: ['self', LITERAL, STRING].concat(NUMBERS)
  };
  var QUOTED1 = {
    className: 'quoted',
    begin: '[\'`]\\(', end: '\\)',
    contains: NUMBERS.concat([STRING, VARIABLE, KEYWORD, QUOTED_LIST])
  };
  var QUOTED2 = {
    className: 'quoted',
    begin: '\\(quote ', end: '\\)',
    keywords: {'title': {'quote': 1}},
    contains: NUMBERS.concat([STRING, VARIABLE, KEYWORD, QUOTED_LIST])
  };
  var LIST = {
    className: 'list',
    begin: '\\(', end: '\\)'
  };
  var BODY = {
    className: 'body',
    endsWithParent: true, excludeEnd: true
  };
  LIST.contains = [{className: 'title', begin: LISP_IDENT_RE}, BODY];
  BODY.contains = [QUOTED1, QUOTED2, LIST, LITERAL].concat(NUMBERS).concat([STRING, COMMENT, VARIABLE, KEYWORD]);

  return {
    case_insensitive: true,
    defaultMode: {
      illegal: '[^\\s]',
      contains: NUMBERS.concat([
        LITERAL,
        STRING,
        COMMENT,
        QUOTED1, QUOTED2,
        LIST
      ])
    }
  };
}();
/*
Language: Lua
Author: Andrew Fedorov <dmmdrs@mail.ru>
*/

hljs.LANGUAGES.lua = function() {
  var OPENING_LONG_BRACKET = '\\[=*\\[';
  var CLOSING_LONG_BRACKET = '\\]=*\\]';
  var LONG_BRACKETS = {
    begin: OPENING_LONG_BRACKET, end: CLOSING_LONG_BRACKET,
    contains: ['self']
  };
  var COMMENTS = [
    {
      className: 'comment',
      begin: '--(?!' + OPENING_LONG_BRACKET + ')', end: '$'
    },
    {
      className: 'comment',
      begin: '--' + OPENING_LONG_BRACKET, end: CLOSING_LONG_BRACKET,
      contains: [LONG_BRACKETS],
      relevance: 10
    }
  ]
  return {
    defaultMode: {
      lexems: hljs.UNDERSCORE_IDENT_RE,
      keywords: {
        'keyword': {
          'and': 1, 'break': 1, 'do': 1, 'else': 1, 'elseif': 1, 'end': 1,
          'false': 1, 'for': 1, 'if': 1, 'in': 1, 'local': 1, 'nil': 1,
          'not': 1, 'or': 1, 'repeat': 1, 'return': 1, 'then': 1, 'true': 1,
          'until': 1, 'while': 1
        },
        'built_in': {
          '_G': 1, '_VERSION': 1, 'assert': 1, 'collectgarbage': 1, 'dofile': 1,
          'error': 1, 'getfenv': 1, 'getmetatable': 1, 'ipairs': 1, 'load': 1,
          'loadfile': 1, 'loadstring': 1, 'module': 1, 'next': 1, 'pairs': 1,
          'pcall': 1, 'print': 1, 'rawequal': 1, 'rawget': 1, 'rawset': 1,
          'require': 1, 'select': 1, 'setfenv': 1, 'setmetatable': 1,
          'tonumber': 1, 'tostring': 1, 'type': 1, 'unpack': 1, 'xpcall': 1,
          'coroutine': 1, 'debug': 1, 'io': 1, 'math': 1, 'os': 1, 'package': 1,
          'string': 1, 'table': 1
        }
      },
      contains: COMMENTS.concat([
        {
          className: 'function',
          begin: '\\bfunction\\b', end: '\\)',
          keywords: {'function': 1},
          contains: [
            {
              className: 'title',
              begin: '([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*'
            },
            {
              className: 'params',
              begin: '\\(', endsWithParent: true,
              contains: COMMENTS
            }
          ].concat(COMMENTS)
        },
        hljs.C_NUMBER_MODE,
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        {
          className: 'string',
          begin: OPENING_LONG_BRACKET, end: CLOSING_LONG_BRACKET,
          contains: [LONG_BRACKETS],
          relevance: 10
        }
      ])
    }
  };
}();
/*
Language: Markdown
Requires: xml.js
Author: John Crepezzi <john.crepezzi@gmail.com>
Website: http://seejohncode.com/
*/

hljs.LANGUAGES.markdown = {
  case_insensitive: true,
  defaultMode: {
    contains: [
      // highlight headers
      {
        className: 'header',
        begin: '^#{1,3}', end: '$'
      },
      {
        className: 'header',
        begin: '^.+?\\n[=-]{2,}$'
      },
      // inline html
      {
        begin: '<', end: '>',
        subLanguage: 'xml'
      },
      // lists (indicators only)
      {
        className: 'bullet',
        begin: '^([*+-]|(\\d+\\.))\\s+'
      },
      // strong segments
      {
        className: 'strong',
        begin: '[*_]{2}.+?[*_]{2}'
      },
      // emphasis segments
      {
        className: 'emphasis',
        begin: '[*_].+?[*_]'
      },
      // blockquotes
      {
        className: 'blockquote',
        begin: '^>\\s+', end: '$'
      },
      // code snippets
      {
        className: 'code',
        begin: '`.+?`'
      },
      {
        className: 'code',
        begin: '^    ', end: '$',
        relevance: 0
      },
      // horizontal rules
      {
        className: 'horizontal_rule',
        begin: '^-{3,}', end: '$'
      },
      // using links - title and link
      {
        begin: '\\[.+?\\]\\(.+?\\)',
        returnBegin: true,
        contains: [
          {
            className: 'link_label',
            begin: '\\[.+\\]'
          },
          {
            className: 'link_url',
            begin: '\\(', end: '\\)',
            excludeBegin: true, excludeEnd: true
          }
        ]
      }
    ]
  }
};
/*
Language: Matlab
Author: Denis Bardadym <bardadymchik@gmail.com>
*/

hljs.LANGUAGES.matlab = {
  defaultMode: {
    keywords: {
      'keyword': {
       'break': 1, 'case': 1,'catch': 1,'classdef': 1,'continue': 1,'else': 1,'elseif': 1,'end': 1,'enumerated': 1,
       'events': 1,'for': 1,'function': 1,'global': 1,'if': 1,'methods': 1,'otherwise': 1,'parfor': 1,
       'persistent': 1,'properties': 1,'return': 1,'spmd': 1,'switch': 1,'try': 1,'while': 1
      },
      'built_in': {
       'sin': 1,'sind': 1,'sinh': 1,'asin': 1,'asind': 1,'asinh': 1,'cos': 1,'cosd': 1,'cosh': 1,
       'acos': 1,'acosd': 1,'acosh': 1,'tan': 1,'tand': 1,'tanh': 1,'atan': 1,'atand': 1,'atan2': 1,
       'atanh': 1,'sec': 1,'secd': 1,'sech': 1,'asec': 1,'asecd': 1,'asech': 1,'csc': 1,'cscd': 1,
       'csch': 1,'acsc': 1,'acscd': 1,'acsch': 1,'cot': 1,'cotd': 1,'coth': 1,'acot': 1,'acotd': 1,
       'acoth': 1,'hypot': 1,'exp': 1,'expm1': 1,'log': 1,'log1p': 1,'log10': 1,'log2': 1,'pow2': 1,
       'realpow': 1,'reallog': 1,'realsqrt': 1,'sqrt': 1,'nthroot': 1,'nextpow2': 1,'abs': 1,
       'angle': 1,'complex': 1,'conj': 1,'imag': 1,'real': 1,'unwrap': 1,'isreal': 1,'cplxpair': 1,
       'fix': 1,'floor': 1,'ceil': 1,'round': 1,'mod': 1,'rem': 1,'sign': 1,
       'airy': 1,'besselj': 1,'bessely': 1,'besselh': 1,'besseli': 1,'besselk': 1,'beta': 1,
       'betainc': 1,'betaln': 1,'ellipj': 1,'ellipke': 1,'erf': 1,'erfc': 1,'erfcx': 1,
       'erfinv': 1,'expint': 1,'gamma': 1,'gammainc': 1,'gammaln': 1,'psi': 1,'legendre': 1,
       'cross': 1,'dot': 1,'factor': 1,'isprime': 1,'primes': 1,'gcd': 1,'lcm': 1,'rat': 1,
       'rats': 1,'perms': 1,'nchoosek': 1,'factorial': 1,'cart2sph': 1,'cart2pol': 1,
       'pol2cart': 1,'sph2cart': 1,'hsv2rgb': 1,'rgb2hsv': 1,
       'zeros': 1,'ones': 1,'eye': 1,'repmat': 1,'rand': 1,'randn': 1,'linspace': 1,'logspace': 1,
       'freqspace': 1,'meshgrid': 1,'accumarray': 1,'size': 1,'length': 1,'ndims': 1,'numel': 1,
       'disp': 1,'isempty': 1,'isequal': 1,'isequalwithequalnans': 1,'cat': 1,'reshape': 1,
       'diag': 1,'blkdiag': 1,'tril': 1,'triu': 1,'fliplr': 1,'flipud': 1,'flipdim': 1,'rot90': 1,
       'find': 1,'end': 1,'sub2ind': 1,'ind2sub': 1,'bsxfun': 1,'ndgrid': 1,'permute': 1,
       'ipermute': 1,'shiftdim': 1,'circshift': 1,'squeeze': 1,'isscalar': 1,'isvector': 1,
       'ans': 1,'eps': 1,'realmax': 1,'realmin': 1,'pi': 1,'i': 1,'inf': 1,'nan': 1,'isnan': 1,
       'isinf': 1,'isfinite': 1,'j': 1,'why': 1,'compan': 1,'gallery': 1,'hadamard': 1,'hankel': 1,
       'hilb': 1,'invhilb': 1,'magic': 1,'pascal': 1,'rosser': 1,'toeplitz': 1,'vander': 1,
       'wilkinson': 1
      },
    },
    illegal: '(//|"|#|/\\*|\\s+/\\w+)',
    contains: [
      {
        className: 'function',
        begin: 'function', end: '$',
        keywords: {'function': 1},
        contains: [
          {
              className: 'title',
              begin: hljs.UNDERSCORE_IDENT_RE
          },
          {
              className: 'params',
              begin: '\\(', end: '\\)'
          },
          {
              className: 'params',
              begin: '\\[', end: '\\]'
          }
        ]
      },
      {
        className: 'string',
        begin: '\'', end: '\'',
        contains: [hljs.BACKSLASH_ESCAPE, {begin: '\'\''}]
      },
      {
        className: 'comment',
        begin: '\\%', end: '$'
      },
      hljs.C_NUMBER_MODE
    ]
  }
};
/*
Language: MEL
Description: Maya Embedded Language
Author: Shuen-Huei Guan <drake.guan@gmail.com>
*/

hljs.LANGUAGES.mel = {
  defaultMode: {
    keywords: {
      'int': 1, 'float': 1, 'string': 1, 'vector': 1, 'matrix': 1,
      'if': 1, 'else': 1, 'switch': 1, 'case': 1, 'default': 1, 'while': 1, 'do': 1, 'for': 1, 'in': 1, 'break': 1, 'continue': 1,
      'global': 1, 'proc': 1, 'return': 1,
      'about': 1, 'abs': 1, 'addAttr': 1, 'addAttributeEditorNodeHelp': 1, 'addDynamic': 1, 'addNewShelfTab': 1,
      'addPP': 1, 'addPanelCategory': 1, 'addPrefixToName': 1, 'advanceToNextDrivenKey': 1, 'affectedNet': 1, 'affects': 1,
      'aimConstraint': 1, 'air': 1, 'alias': 1, 'aliasAttr': 1, 'align': 1, 'alignCtx': 1, 'alignCurve': 1, 'alignSurface': 1,
      'allViewFit': 1, 'ambientLight': 1, 'angle': 1, 'angleBetween': 1, 'animCone': 1, 'animCurveEditor': 1, 'animDisplay': 1,
      'animView': 1, 'annotate': 1, 'appendStringArray': 1, 'applicationName': 1, 'applyAttrPreset': 1, 'applyTake': 1, 'arcLenDimContext': 1,
      'arcLengthDimension': 1, 'arclen': 1, 'arrayMapper': 1, 'art3dPaintCtx': 1, 'artAttrCtx': 1, 'artAttrPaintVertexCtx': 1, 'artAttrSkinPaintCtx': 1,
      'artAttrTool': 1, 'artBuildPaintMenu': 1, 'artFluidAttrCtx': 1, 'artPuttyCtx': 1, 'artSelectCtx': 1, 'artSetPaintCtx': 1, 'artUserPaintCtx': 1,
      'assignCommand': 1, 'assignInputDevice': 1, 'assignViewportFactories': 1, 'attachCurve': 1, 'attachDeviceAttr': 1, 'attachSurface': 1, 'attrColorSliderGrp': 1, 'attrCompatibility': 1, 'attrControlGrp': 1, 'attrEnumOptionMenu': 1, 'attrEnumOptionMenuGrp': 1, 'attrFieldGrp': 1, 'attrFieldSliderGrp': 1, 'attrNavigationControlGrp': 1, 'attrPresetEditWin': 1, 'attributeExists': 1, 'attributeInfo': 1, 'attributeMenu': 1, 'attributeQuery': 1, 'autoKeyframe': 1, 'autoPlace': 1, 'bakeClip': 1, 'bakeFluidShading': 1, 'bakePartialHistory': 1, 'bakeResults': 1, 'bakeSimulation': 1, 'basename': 1, 'basenameEx': 1, 'batchRender': 1, 'bessel': 1, 'bevel': 1, 'bevelPlus': 1, 'binMembership': 1, 'bindSkin': 1, 'blend2': 1, 'blendShape': 1, 'blendShapeEditor': 1, 'blendShapePanel': 1, 'blendTwoAttr': 1, 'blindDataType': 1, 'boneLattice': 1, 'boundary': 1, 'boxDollyCtx': 1, 'boxZoomCtx': 1, 'bufferCurve': 1, 'buildBookmarkMenu': 1, 'buildKeyframeMenu': 1, 'button': 1, 'buttonManip': 1, 'CBG': 1, 'cacheFile': 1, 'cacheFileCombine': 1, 'cacheFileMerge': 1, 'cacheFileTrack': 1, 'camera': 1, 'cameraView': 1, 'canCreateManip': 1, 'canvas': 1, 'capitalizeString': 1, 'catch': 1, 'catchQuiet': 1, 'ceil': 1, 'changeSubdivComponentDisplayLevel': 1, 'changeSubdivRegion': 1, 'channelBox': 1, 'character': 1, 'characterMap': 1, 'characterOutlineEditor': 1, 'characterize': 1, 'chdir': 1, 'checkBox': 1, 'checkBoxGrp': 1, 'checkDefaultRenderGlobals': 1, 'choice': 1, 'circle': 1, 'circularFillet': 1, 'clamp': 1, 'clear': 1, 'clearCache': 1, 'clip': 1, 'clipEditor': 1, 'clipEditorCurrentTimeCtx': 1, 'clipSchedule': 1, 'clipSchedulerOutliner': 1, 'clipTrimBefore': 1, 'closeCurve': 1, 'closeSurface': 1, 'cluster': 1, 'cmdFileOutput': 1, 'cmdScrollFieldExecuter': 1, 'cmdScrollFieldReporter': 1, 'cmdShell': 1, 'coarsenSubdivSelectionList': 1, 'collision': 1, 'color': 1, 'colorAtPoint': 1, 'colorEditor': 1, 'colorIndex': 1, 'colorIndexSliderGrp': 1, 'colorSliderButtonGrp': 1, 'colorSliderGrp': 1, 'columnLayout': 1, 'commandEcho': 1, 'commandLine': 1, 'commandPort': 1, 'compactHairSystem': 1, 'componentEditor': 1, 'compositingInterop': 1, 'computePolysetVolume': 1, 'condition': 1, 'cone': 1, 'confirmDialog': 1, 'connectAttr': 1, 'connectControl': 1, 'connectDynamic': 1, 'connectJoint': 1, 'connectionInfo': 1, 'constrain': 1, 'constrainValue': 1, 'constructionHistory': 1, 'container': 1, 'containsMultibyte': 1, 'contextInfo': 1, 'control': 1, 'convertFromOldLayers': 1, 'convertIffToPsd': 1, 'convertLightmap': 1, 'convertSolidTx': 1, 'convertTessellation': 1, 'convertUnit': 1, 'copyArray': 1, 'copyFlexor': 1, 'copyKey': 1, 'copySkinWeights': 1, 'cos': 1, 'cpButton': 1, 'cpCache': 1, 'cpClothSet': 1, 'cpCollision': 1, 'cpConstraint': 1, 'cpConvClothToMesh': 1, 'cpForces': 1, 'cpGetSolverAttr': 1, 'cpPanel': 1, 'cpProperty': 1, 'cpRigidCollisionFilter': 1, 'cpSeam': 1, 'cpSetEdit': 1, 'cpSetSolverAttr': 1, 'cpSolver': 1, 'cpSolverTypes': 1, 'cpTool': 1, 'cpUpdateClothUVs': 1, 'createDisplayLayer': 1, 'createDrawCtx': 1, 'createEditor': 1, 'createLayeredPsdFile': 1, 'createMotionField': 1, 'createNewShelf': 1, 'createNode': 1, 'createRenderLayer': 1, 'createSubdivRegion': 1, 'cross': 1, 'crossProduct': 1, 'ctxAbort': 1, 'ctxCompletion': 1, 'ctxEditMode': 1, 'ctxTraverse': 1, 'currentCtx': 1, 'currentTime': 1, 'currentTimeCtx': 1, 'currentUnit': 1, 'currentUnit': 1, 'curve': 1, 'curveAddPtCtx': 1, 'curveCVCtx': 1, 'curveEPCtx': 1, 'curveEditorCtx': 1, 'curveIntersect': 1, 'curveMoveEPCtx': 1, 'curveOnSurface': 1, 'curveSketchCtx': 1, 'cutKey': 1, 'cycleCheck': 1, 'cylinder': 1, 'dagPose': 1, 'date': 1, 'defaultLightListCheckBox': 1, 'defaultNavigation': 1, 'defineDataServer': 1, 'defineVirtualDevice': 1, 'deformer': 1, 'deg_to_rad': 1, 'delete': 1, 'deleteAttr': 1, 'deleteShadingGroupsAndMaterials': 1, 'deleteShelfTab': 1, 'deleteUI': 1, 'deleteUnusedBrushes': 1, 'delrandstr': 1, 'detachCurve': 1, 'detachDeviceAttr': 1, 'detachSurface': 1, 'deviceEditor': 1, 'devicePanel': 1, 'dgInfo': 1, 'dgdirty': 1, 'dgeval': 1, 'dgtimer': 1, 'dimWhen': 1, 'directKeyCtx': 1, 'directionalLight': 1, 'dirmap': 1, 'dirname': 1, 'disable': 1, 'disconnectAttr': 1, 'disconnectJoint': 1, 'diskCache': 1, 'displacementToPoly': 1, 'displayAffected': 1, 'displayColor': 1, 'displayCull': 1, 'displayLevelOfDetail': 1, 'displayPref': 1, 'displayRGBColor': 1, 'displaySmoothness': 1, 'displayStats': 1, 'displayString': 1, 'displaySurface': 1, 'distanceDimContext': 1, 'distanceDimension': 1, 'doBlur': 1, 'dolly': 1, 'dollyCtx': 1, 'dopeSheetEditor': 1, 'dot': 1, 'dotProduct': 1, 'doubleProfileBirailSurface': 1, 'drag': 1, 'dragAttrContext': 1, 'draggerContext': 1, 'dropoffLocator': 1, 'duplicate': 1, 'duplicateCurve': 1, 'duplicateSurface': 1, 'dynCache': 1, 'dynControl': 1, 'dynExport': 1, 'dynExpression': 1, 'dynGlobals': 1, 'dynPaintEditor': 1, 'dynParticleCtx': 1, 'dynPref': 1, 'dynRelEdPanel': 1, 'dynRelEditor': 1, 'dynamicLoad': 1, 'editAttrLimits': 1, 'editDisplayLayerGlobals': 1, 'editDisplayLayerMembers': 1, 'editRenderLayerAdjustment': 1, 'editRenderLayerGlobals': 1, 'editRenderLayerMembers': 1, 'editor': 1, 'editorTemplate': 1, 'effector': 1, 'emit': 1, 'emitter': 1, 'enableDevice': 1, 'encodeString': 1, 'endString': 1, 'endsWith': 1, 'env': 1, 'equivalent': 1, 'equivalentTol': 1, 'erf': 1, 'error': 1, 'eval': 1, 'eval': 1, 'evalDeferred': 1, 'evalEcho': 1, 'event': 1, 'exactWorldBoundingBox': 1, 'exclusiveLightCheckBox': 1, 'exec': 1, 'executeForEachObject': 1, 'exists': 1, 'exp': 1, 'expression': 1, 'expressionEditorListen': 1, 'extendCurve': 1, 'extendSurface': 1, 'extrude': 1, 'fcheck': 1, 'fclose': 1, 'feof': 1, 'fflush': 1, 'fgetline': 1, 'fgetword': 1, 'file': 1, 'fileBrowserDialog': 1, 'fileDialog': 1, 'fileExtension': 1, 'fileInfo': 1, 'filetest': 1, 'filletCurve': 1, 'filter': 1, 'filterCurve': 1, 'filterExpand': 1, 'filterStudioImport': 1, 'findAllIntersections': 1, 'findAnimCurves': 1, 'findKeyframe': 1, 'findMenuItem': 1, 'findRelatedSkinCluster': 1, 'finder': 1, 'firstParentOf': 1, 'fitBspline': 1, 'flexor': 1, 'floatEq': 1, 'floatField': 1, 'floatFieldGrp': 1, 'floatScrollBar': 1, 'floatSlider': 1, 'floatSlider2': 1, 'floatSliderButtonGrp': 1, 'floatSliderGrp': 1, 'floor': 1, 'flow': 1, 'fluidCacheInfo': 1, 'fluidEmitter': 1, 'fluidVoxelInfo': 1, 'flushUndo': 1, 'fmod': 1, 'fontDialog': 1, 'fopen': 1, 'formLayout': 1, 'format': 1, 'fprint': 1, 'frameLayout': 1, 'fread': 1, 'freeFormFillet': 1, 'frewind': 1, 'fromNativePath': 1, 'fwrite': 1, 'gamma': 1, 'gauss': 1, 'geometryConstraint': 1, 'getApplicationVersionAsFloat': 1, 'getAttr': 1, 'getClassification': 1, 'getDefaultBrush': 1, 'getFileList': 1, 'getFluidAttr': 1, 'getInputDeviceRange': 1, 'getMayaPanelTypes': 1, 'getModifiers': 1, 'getPanel': 1, 'getParticleAttr': 1, 'getPluginResource': 1, 'getenv': 1, 'getpid': 1, 'glRender': 1, 'glRenderEditor': 1, 'globalStitch': 1, 'gmatch': 1, 'goal': 1, 'gotoBindPose': 1, 'grabColor': 1, 'gradientControl': 1, 'gradientControlNoAttr': 1, 'graphDollyCtx': 1, 'graphSelectContext': 1, 'graphTrackCtx': 1, 'gravity': 1, 'grid': 1, 'gridLayout': 1, 'group': 1, 'groupObjectsByName': 1, 'HfAddAttractorToAS': 1, 'HfAssignAS': 1, 'HfBuildEqualMap': 1, 'HfBuildFurFiles': 1, 'HfBuildFurImages': 1, 'HfCancelAFR': 1, 'HfConnectASToHF': 1, 'HfCreateAttractor': 1, 'HfDeleteAS': 1, 'HfEditAS': 1, 'HfPerformCreateAS': 1, 'HfRemoveAttractorFromAS': 1, 'HfSelectAttached': 1, 'HfSelectAttractors': 1, 'HfUnAssignAS': 1, 'hardenPointCurve': 1, 'hardware': 1, 'hardwareRenderPanel': 1, 'headsUpDisplay': 1, 'headsUpMessage': 1, 'help': 1, 'helpLine': 1, 'hermite': 1, 'hide': 1, 'hilite': 1, 'hitTest': 1, 'hotBox': 1, 'hotkey': 1, 'hotkeyCheck': 1, 'hsv_to_rgb': 1, 'hudButton': 1, 'hudSlider': 1, 'hudSliderButton': 1, 'hwReflectionMap': 1, 'hwRender': 1, 'hwRenderLoad': 1, 'hyperGraph': 1, 'hyperPanel': 1, 'hyperShade': 1, 'hypot': 1, 'iconTextButton': 1, 'iconTextCheckBox': 1, 'iconTextRadioButton': 1, 'iconTextRadioCollection': 1, 'iconTextScrollList': 1, 'iconTextStaticLabel': 1, 'ikHandle': 1, 'ikHandleCtx': 1, 'ikHandleDisplayScale': 1, 'ikSolver': 1, 'ikSplineHandleCtx': 1, 'ikSystem': 1, 'ikSystemInfo': 1, 'ikfkDisplayMethod': 1, 'illustratorCurves': 1, 'image': 1, 'imfPlugins': 1, 'inheritTransform': 1, 'insertJoint': 1, 'insertJointCtx': 1, 'insertKeyCtx': 1, 'insertKnotCurve': 1, 'insertKnotSurface': 1, 'instance': 1, 'instanceable': 1, 'instancer': 1, 'intField': 1, 'intFieldGrp': 1, 'intScrollBar': 1, 'intSlider': 1, 'intSliderGrp': 1, 'interToUI': 1, 'internalVar': 1, 'intersect': 1, 'iprEngine': 1, 'isAnimCurve': 1, 'isConnected': 1, 'isDirty': 1, 'isParentOf': 1, 'isSameObject': 1, 'isTrue': 1, 'isValidObjectName': 1, 'isValidString': 1, 'isValidUiName': 1, 'isolateSelect': 1, 'itemFilter': 1, 'itemFilterAttr': 1, 'itemFilterRender': 1, 'itemFilterType': 1, 'joint': 1, 'jointCluster': 1, 'jointCtx': 1, 'jointDisplayScale': 1, 'jointLattice': 1, 'keyTangent': 1, 'keyframe': 1, 'keyframeOutliner': 1, 'keyframeRegionCurrentTimeCtx': 1, 'keyframeRegionDirectKeyCtx': 1, 'keyframeRegionDollyCtx': 1, 'keyframeRegionInsertKeyCtx': 1, 'keyframeRegionMoveKeyCtx': 1, 'keyframeRegionScaleKeyCtx': 1, 'keyframeRegionSelectKeyCtx': 1, 'keyframeRegionSetKeyCtx': 1, 'keyframeRegionTrackCtx': 1, 'keyframeStats': 1, 'lassoContext': 1, 'lattice': 1, 'latticeDeformKeyCtx': 1, 'launch': 1, 'launchImageEditor': 1, 'layerButton': 1, 'layeredShaderPort': 1, 'layeredTexturePort': 1, 'layout': 1, 'layoutDialog': 1, 'lightList': 1, 'lightListEditor': 1, 'lightListPanel': 1, 'lightlink': 1, 'lineIntersection': 1, 'linearPrecision': 1, 'linstep': 1, 'listAnimatable': 1, 'listAttr': 1, 'listCameras': 1, 'listConnections': 1, 'listDeviceAttachments': 1, 'listHistory': 1, 'listInputDeviceAxes': 1, 'listInputDeviceButtons': 1, 'listInputDevices': 1, 'listMenuAnnotation': 1, 'listNodeTypes': 1, 'listPanelCategories': 1, 'listRelatives': 1, 'listSets': 1, 'listTransforms': 1, 'listUnselected': 1, 'listerEditor': 1, 'loadFluid': 1, 'loadNewShelf': 1, 'loadPlugin': 1, 'loadPluginLanguageResources': 1, 'loadPrefObjects': 1, 'localizedPanelLabel': 1, 'lockNode': 1, 'loft': 1, 'log': 1, 'longNameOf': 1, 'lookThru': 1, 'ls': 1, 'lsThroughFilter': 1, 'lsType': 1, 'lsUI': 1, 'Mayatomr': 1, 'mag': 1, 'makeIdentity': 1, 'makeLive': 1, 'makePaintable': 1, 'makeRoll': 1, 'makeSingleSurface': 1, 'makeTubeOn': 1, 'makebot': 1, 'manipMoveContext': 1, 'manipMoveLimitsCtx': 1, 'manipOptions': 1, 'manipRotateContext': 1, 'manipRotateLimitsCtx': 1, 'manipScaleContext': 1, 'manipScaleLimitsCtx': 1, 'marker': 1, 'match': 1, 'max': 1, 'memory': 1, 'menu': 1, 'menuBarLayout': 1, 'menuEditor': 1, 'menuItem': 1, 'menuItemToShelf': 1, 'menuSet': 1, 'menuSetPref': 1, 'messageLine': 1, 'min': 1, 'minimizeApp': 1, 'mirrorJoint': 1, 'modelCurrentTimeCtx': 1, 'modelEditor': 1, 'modelPanel': 1, 'mouse': 1, 'movIn': 1, 'movOut': 1, 'move': 1, 'moveIKtoFK': 1, 'moveKeyCtx': 1, 'moveVertexAlongDirection': 1, 'multiProfileBirailSurface': 1, 'mute': 1, 'nParticle': 1, 'nameCommand': 1, 'nameField': 1, 'namespace': 1, 'namespaceInfo': 1, 'newPanelItems': 1, 'newton': 1, 'nodeCast': 1, 'nodeIconButton': 1, 'nodeOutliner': 1, 'nodePreset': 1, 'nodeType': 1, 'noise': 1, 'nonLinear': 1, 'normalConstraint': 1, 'normalize': 1, 'nurbsBoolean': 1, 'nurbsCopyUVSet': 1, 'nurbsCube': 1, 'nurbsEditUV': 1, 'nurbsPlane': 1, 'nurbsSelect': 1, 'nurbsSquare': 1, 'nurbsToPoly': 1, 'nurbsToPolygonsPref': 1, 'nurbsToSubdiv': 1, 'nurbsToSubdivPref': 1, 'nurbsUVSet': 1, 'nurbsViewDirectionVector': 1, 'objExists': 1, 'objectCenter': 1, 'objectLayer': 1, 'objectType': 1, 'objectTypeUI': 1, 'obsoleteProc': 1, 'oceanNurbsPreviewPlane': 1, 'offsetCurve': 1, 'offsetCurveOnSurface': 1, 'offsetSurface': 1, 'openGLExtension': 1, 'openMayaPref': 1, 'optionMenu': 1, 'optionMenuGrp': 1, 'optionVar': 1, 'orbit': 1, 'orbitCtx': 1, 'orientConstraint': 1, 'outlinerEditor': 1, 'outlinerPanel': 1, 'overrideModifier': 1, 'paintEffectsDisplay': 1, 'pairBlend': 1, 'palettePort': 1, 'paneLayout': 1, 'panel': 1, 'panelConfiguration': 1, 'panelHistory': 1, 'paramDimContext': 1, 'paramDimension': 1, 'paramLocator': 1, 'parent': 1, 'parentConstraint': 1, 'particle': 1, 'particleExists': 1, 'particleInstancer': 1, 'particleRenderInfo': 1, 'partition': 1, 'pasteKey': 1, 'pathAnimation': 1, 'pause': 1, 'pclose': 1, 'percent': 1, 'performanceOptions': 1, 'pfxstrokes': 1, 'pickWalk': 1, 'picture': 1, 'pixelMove': 1, 'planarSrf': 1, 'plane': 1, 'play': 1, 'playbackOptions': 1, 'playblast': 1, 'plugAttr': 1, 'plugNode': 1, 'pluginInfo': 1, 'pluginResourceUtil': 1, 'pointConstraint': 1, 'pointCurveConstraint': 1, 'pointLight': 1, 'pointMatrixMult': 1, 'pointOnCurve': 1, 'pointOnSurface': 1, 'pointPosition': 1, 'poleVectorConstraint': 1, 'polyAppend': 1, 'polyAppendFacetCtx': 1, 'polyAppendVertex': 1, 'polyAutoProjection': 1, 'polyAverageNormal': 1, 'polyAverageVertex': 1, 'polyBevel': 1, 'polyBlendColor': 1, 'polyBlindData': 1, 'polyBoolOp': 1, 'polyBridgeEdge': 1, 'polyCacheMonitor': 1, 'polyCheck': 1, 'polyChipOff': 1, 'polyClipboard': 1, 'polyCloseBorder': 1, 'polyCollapseEdge': 1, 'polyCollapseFacet': 1, 'polyColorBlindData': 1, 'polyColorDel': 1, 'polyColorPerVertex': 1, 'polyColorSet': 1, 'polyCompare': 1, 'polyCone': 1, 'polyCopyUV': 1, 'polyCrease': 1, 'polyCreaseCtx': 1, 'polyCreateFacet': 1, 'polyCreateFacetCtx': 1, 'polyCube': 1, 'polyCut': 1, 'polyCutCtx': 1, 'polyCylinder': 1, 'polyCylindricalProjection': 1, 'polyDelEdge': 1, 'polyDelFacet': 1, 'polyDelVertex': 1, 'polyDuplicateAndConnect': 1, 'polyDuplicateEdge': 1, 'polyEditUV': 1, 'polyEditUVShell': 1, 'polyEvaluate': 1, 'polyExtrudeEdge': 1, 'polyExtrudeFacet': 1, 'polyExtrudeVertex': 1, 'polyFlipEdge': 1, 'polyFlipUV': 1, 'polyForceUV': 1, 'polyGeoSampler': 1, 'polyHelix': 1, 'polyInfo': 1, 'polyInstallAction': 1, 'polyLayoutUV': 1, 'polyListComponentConversion': 1, 'polyMapCut': 1, 'polyMapDel': 1, 'polyMapSew': 1, 'polyMapSewMove': 1, 'polyMergeEdge': 1, 'polyMergeEdgeCtx': 1, 'polyMergeFacet': 1, 'polyMergeFacetCtx': 1, 'polyMergeUV': 1, 'polyMergeVertex': 1, 'polyMirrorFace': 1, 'polyMoveEdge': 1, 'polyMoveFacet': 1, 'polyMoveFacetUV': 1, 'polyMoveUV': 1, 'polyMoveVertex': 1, 'polyNormal': 1, 'polyNormalPerVertex': 1, 'polyNormalizeUV': 1, 'polyOptUvs': 1, 'polyOptions': 1, 'polyOutput': 1, 'polyPipe': 1, 'polyPlanarProjection': 1, 'polyPlane': 1, 'polyPlatonicSolid': 1, 'polyPoke': 1, 'polyPrimitive': 1, 'polyPrism': 1, 'polyProjection': 1, 'polyPyramid': 1, 'polyQuad': 1, 'polyQueryBlindData': 1, 'polyReduce': 1, 'polySelect': 1, 'polySelectConstraint': 1, 'polySelectConstraintMonitor': 1, 'polySelectCtx': 1, 'polySelectEditCtx': 1, 'polySeparate': 1, 'polySetToFaceNormal': 1, 'polySewEdge': 1, 'polyShortestPathCtx': 1, 'polySmooth': 1, 'polySoftEdge': 1, 'polySphere': 1, 'polySphericalProjection': 1, 'polySplit': 1, 'polySplitCtx': 1, 'polySplitEdge': 1, 'polySplitRing': 1, 'polySplitVertex': 1, 'polyStraightenUVBorder': 1, 'polySubdivideEdge': 1, 'polySubdivideFacet': 1, 'polyToSubdiv': 1, 'polyTorus': 1, 'polyTransfer': 1, 'polyTriangulate': 1, 'polyUVSet': 1, 'polyUnite': 1, 'polyWedgeFace': 1, 'popen': 1, 'popupMenu': 1, 'pose': 1, 'pow': 1, 'preloadRefEd': 1, 'print': 1, 'progressBar': 1, 'progressWindow': 1, 'projFileViewer': 1, 'projectCurve': 1, 'projectTangent': 1, 'projectionContext': 1, 'projectionManip': 1, 'promptDialog': 1, 'propModCtx': 1, 'propMove': 1, 'psdChannelOutliner': 1, 'psdEditTextureFile': 1, 'psdExport': 1, 'psdTextureFile': 1, 'putenv': 1, 'pwd': 1, 'python': 1, 'querySubdiv': 1, 'quit': 1, 'rad_to_deg': 1, 'radial': 1, 'radioButton': 1, 'radioButtonGrp': 1, 'radioCollection': 1, 'radioMenuItemCollection': 1, 'rampColorPort': 1, 'rand': 1, 'randomizeFollicles': 1, 'randstate': 1, 'rangeControl': 1, 'readTake': 1, 'rebuildCurve': 1, 'rebuildSurface': 1, 'recordAttr': 1, 'recordDevice': 1, 'redo': 1, 'reference': 1, 'referenceEdit': 1, 'referenceQuery': 1, 'refineSubdivSelectionList': 1, 'refresh': 1, 'refreshAE': 1, 'registerPluginResource': 1, 'rehash': 1, 'reloadImage': 1, 'removeJoint': 1, 'removeMultiInstance': 1, 'removePanelCategory': 1, 'rename': 1, 'renameAttr': 1, 'renameSelectionList': 1, 'renameUI': 1, 'render': 1, 'renderGlobalsNode': 1, 'renderInfo': 1, 'renderLayerButton': 1, 'renderLayerParent': 1, 'renderLayerPostProcess': 1, 'renderLayerUnparent': 1, 'renderManip': 1, 'renderPartition': 1, 'renderQualityNode': 1, 'renderSettings': 1, 'renderThumbnailUpdate': 1, 'renderWindowEditor': 1, 'renderWindowSelectContext': 1, 'renderer': 1, 'reorder': 1, 'reorderDeformers': 1, 'requires': 1, 'reroot': 1, 'resampleFluid': 1, 'resetAE': 1, 'resetPfxToPolyCamera': 1, 'resetTool': 1, 'resolutionNode': 1, 'retarget': 1, 'reverseCurve': 1, 'reverseSurface': 1, 'revolve': 1, 'rgb_to_hsv': 1, 'rigidBody': 1, 'rigidSolver': 1, 'roll': 1, 'rollCtx': 1, 'rootOf': 1, 'rot': 1, 'rotate': 1, 'rotationInterpolation': 1, 'roundConstantRadius': 1, 'rowColumnLayout': 1, 'rowLayout': 1, 'runTimeCommand': 1, 'runup': 1, 'sampleImage': 1, 'saveAllShelves': 1, 'saveAttrPreset': 1, 'saveFluid': 1, 'saveImage': 1, 'saveInitialState': 1, 'saveMenu': 1, 'savePrefObjects': 1, 'savePrefs': 1, 'saveShelf': 1, 'saveToolSettings': 1, 'scale': 1, 'scaleBrushBrightness': 1, 'scaleComponents': 1, 'scaleConstraint': 1, 'scaleKey': 1, 'scaleKeyCtx': 1, 'sceneEditor': 1, 'sceneUIReplacement': 1, 'scmh': 1, 'scriptCtx': 1, 'scriptEditorInfo': 1, 'scriptJob': 1, 'scriptNode': 1, 'scriptTable': 1, 'scriptToShelf': 1, 'scriptedPanel': 1, 'scriptedPanelType': 1, 'scrollField': 1, 'scrollLayout': 1, 'sculpt': 1, 'searchPathArray': 1, 'seed': 1, 'selLoadSettings': 1, 'select': 1, 'selectContext': 1, 'selectCurveCV': 1, 'selectKey': 1, 'selectKeyCtx': 1, 'selectKeyframeRegionCtx': 1, 'selectMode': 1, 'selectPref': 1, 'selectPriority': 1, 'selectType': 1, 'selectedNodes': 1, 'selectionConnection': 1, 'separator': 1, 'setAttr': 1, 'setAttrEnumResource': 1, 'setAttrMapping': 1, 'setAttrNiceNameResource': 1, 'setConstraintRestPosition': 1, 'setDefaultShadingGroup': 1, 'setDrivenKeyframe': 1, 'setDynamic': 1, 'setEditCtx': 1, 'setEditor': 1, 'setFluidAttr': 1, 'setFocus': 1, 'setInfinity': 1, 'setInputDeviceMapping': 1, 'setKeyCtx': 1, 'setKeyPath': 1, 'setKeyframe': 1, 'setKeyframeBlendshapeTargetWts': 1, 'setMenuMode': 1, 'setNodeNiceNameResource': 1, 'setNodeTypeFlag': 1, 'setParent': 1, 'setParticleAttr': 1, 'setPfxToPolyCamera': 1, 'setPluginResource': 1, 'setProject': 1, 'setStampDensity': 1, 'setStartupMessage': 1, 'setState': 1, 'setToolTo': 1, 'setUITemplate': 1, 'setXformManip': 1, 'sets': 1, 'shadingConnection': 1, 'shadingGeometryRelCtx': 1, 'shadingLightRelCtx': 1, 'shadingNetworkCompare': 1, 'shadingNode': 1, 'shapeCompare': 1, 'shelfButton': 1, 'shelfLayout': 1, 'shelfTabLayout': 1, 'shellField': 1, 'shortNameOf': 1, 'showHelp': 1, 'showHidden': 1, 'showManipCtx': 1, 'showSelectionInTitle': 1, 'showShadingGroupAttrEditor': 1, 'showWindow': 1, 'sign': 1, 'simplify': 1, 'sin': 1, 'singleProfileBirailSurface': 1, 'size': 1, 'sizeBytes': 1, 'skinCluster': 1, 'skinPercent': 1, 'smoothCurve': 1, 'smoothTangentSurface': 1, 'smoothstep': 1, 'snap2to2': 1, 'snapKey': 1, 'snapMode': 1, 'snapTogetherCtx': 1, 'snapshot': 1, 'soft': 1, 'softMod': 1, 'softModCtx': 1, 'sort': 1, 'sound': 1, 'soundControl': 1, 'source': 1, 'spaceLocator': 1, 'sphere': 1, 'sphrand': 1, 'spotLight': 1, 'spotLightPreviewPort': 1, 'spreadSheetEditor': 1, 'spring': 1, 'sqrt': 1, 'squareSurface': 1, 'srtContext': 1, 'stackTrace': 1, 'startString': 1, 'startsWith': 1, 'stitchAndExplodeShell': 1, 'stitchSurface': 1, 'stitchSurfacePoints': 1, 'strcmp': 1, 'stringArrayCatenate': 1, 'stringArrayContains': 1, 'stringArrayCount': 1, 'stringArrayInsertAtIndex': 1, 'stringArrayIntersector': 1, 'stringArrayRemove': 1, 'stringArrayRemoveAtIndex': 1, 'stringArrayRemoveDuplicates': 1, 'stringArrayRemoveExact': 1, 'stringArrayToString': 1, 'stringToStringArray': 1, 'strip': 1, 'stripPrefixFromName': 1, 'stroke': 1, 'subdAutoProjection': 1, 'subdCleanTopology': 1, 'subdCollapse': 1, 'subdDuplicateAndConnect': 1, 'subdEditUV': 1, 'subdListComponentConversion': 1, 'subdMapCut': 1, 'subdMapSewMove': 1, 'subdMatchTopology': 1, 'subdMirror': 1, 'subdToBlind': 1, 'subdToPoly': 1, 'subdTransferUVsToCache': 1, 'subdiv': 1, 'subdivCrease': 1, 'subdivDisplaySmoothness': 1, 'substitute': 1, 'substituteAllString': 1, 'substituteGeometry': 1, 'substring': 1, 'surface': 1, 'surfaceSampler': 1, 'surfaceShaderList': 1, 'swatchDisplayPort': 1, 'switchTable': 1, 'symbolButton': 1, 'symbolCheckBox': 1, 'sysFile': 1, 'system': 1, 'tabLayout': 1, 'tan': 1, 'tangentConstraint': 1, 'texLatticeDeformContext': 1, 'texManipContext': 1, 'texMoveContext': 1, 'texMoveUVShellContext': 1, 'texRotateContext': 1, 'texScaleContext': 1, 'texSelectContext': 1, 'texSelectShortestPathCtx': 1, 'texSmudgeUVContext': 1, 'texWinToolCtx': 1, 'text': 1, 'textCurves': 1, 'textField': 1, 'textFieldButtonGrp': 1, 'textFieldGrp': 1, 'textManip': 1, 'textScrollList': 1, 'textToShelf': 1, 'textureDisplacePlane': 1, 'textureHairColor': 1, 'texturePlacementContext': 1, 'textureWindow': 1, 'threadCount': 1, 'threePointArcCtx': 1, 'timeControl': 1, 'timePort': 1, 'timerX': 1, 'toNativePath': 1, 'toggle': 1, 'toggleAxis': 1, 'toggleWindowVisibility': 1, 'tokenize': 1, 'tokenizeList': 1, 'tolerance': 1, 'tolower': 1, 'toolButton': 1, 'toolCollection': 1, 'toolDropped': 1, 'toolHasOptions': 1, 'toolPropertyWindow': 1, 'torus': 1, 'toupper': 1, 'trace': 1, 'track': 1, 'trackCtx': 1, 'transferAttributes': 1, 'transformCompare': 1, 'transformLimits': 1, 'translator': 1, 'trim': 1, 'trunc': 1, 'truncateFluidCache': 1, 'truncateHairCache': 1, 'tumble': 1, 'tumbleCtx': 1, 'turbulence': 1, 'twoPointArcCtx': 1, 'uiRes': 1, 'uiTemplate': 1, 'unassignInputDevice': 1, 'undo': 1, 'undoInfo': 1, 'ungroup': 1, 'uniform': 1, 'unit': 1, 'unloadPlugin': 1, 'untangleUV': 1, 'untitledFileName': 1, 'untrim': 1, 'upAxis': 1, 'updateAE': 1, 'userCtx': 1, 'uvLink': 1, 'uvSnapshot': 1, 'validateShelfName': 1, 'vectorize': 1, 'view2dToolCtx': 1, 'viewCamera': 1, 'viewClipPlane': 1, 'viewFit': 1, 'viewHeadOn': 1, 'viewLookAt': 1, 'viewManip': 1, 'viewPlace': 1, 'viewSet': 1, 'visor': 1, 'volumeAxis': 1, 'vortex': 1, 'waitCursor': 1, 'warning': 1, 'webBrowser': 1, 'webBrowserPrefs': 1, 'whatIs': 1, 'window': 1, 'windowPref': 1, 'wire': 1, 'wireContext': 1, 'workspace': 1, 'wrinkle': 1, 'wrinkleContext': 1, 'writeTake': 1, 'xbmLangPathList': 1, 'xform': 1
    },
    illegal: '</',
    contains: [
      hljs.C_NUMBER_MODE,
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      {
        className: 'string',
        begin: '`', end: '`',
        contains: [hljs.BACKSLASH_ESCAPE]
      },
      {
        className: 'variable',
        begin: '\\$\\d',
        relevance: 5
      },
      {
        className: 'variable',
        begin: '[\\$\\%\\@\\*](\\^\\w\\b|#\\w+|[^\\s\\w{]|{\\w+}|\\w+)'
      },
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE
    ]
  }
};
/*
Language: Nginx
Author: Peter Leonov <gojpeg@yandex.ru>
*/

hljs.LANGUAGES.nginx = function() {
  var VAR1 = {
    className: 'variable',
    begin: '\\$\\d+'
  };
  var VAR2 = {
    className: 'variable',
    begin: '\\${', end: '}'
  };
  var VAR3 = {
    className: 'variable',
    begin: '[\\$\\@]' + hljs.UNDERSCORE_IDENT_RE
  };

  return {
    defaultMode: {
      contains: [
        hljs.HASH_COMMENT_MODE,
        { // directive
          begin: hljs.UNDERSCORE_IDENT_RE, end: ';|{', returnEnd: true,
          keywords: {
            accept_mutex: 1, accept_mutex_delay: 1, access_log: 1,
            add_after_body: 1, add_before_body: 1, add_header: 1,
            addition_types: 1, alias: 1, allow: 1, ancient_browser: 1,
            ancient_browser_value: 1, auth_basic: 1, auth_basic_user_file: 1,
            autoindex: 1, autoindex_exact_size: 1, autoindex_localtime: 1,
            'break': 1, charset: 1, charset_map: 1,
            charset_types: 1, client_body_buffer_size: 1,
            client_body_in_file_only: 1, client_body_in_single_buffer: 1,
            client_body_temp_path: 1, client_body_timeout: 1,
            client_header_buffer_size: 1, client_header_timeout: 1,
            client_max_body_size: 1, connection_pool_size: 1, connections: 1,
            create_full_put_path: 1, daemon: 1, dav_access: 1, dav_methods: 1,
            debug_connection: 1, debug_points: 1, default_type: 1, deny: 1,
            directio: 1, directio_alignment: 1, echo: 1, echo_after_body: 1,
            echo_before_body: 1, echo_blocking_sleep: 1, echo_duplicate: 1,
            echo_end: 1, echo_exec: 1, echo_flush: 1, echo_foreach_split: 1,
            echo_location: 1, echo_location_async: 1, echo_read_request_body: 1,
            echo_request_body: 1, echo_reset_timer: 1, echo_sleep: 1,
            echo_subrequest: 1, echo_subrequest_async: 1, empty_gif: 1,
            env: 1, error_log: 1, error_page: 1,
            events: 1, expires: 1, fastcgi_bind: 1, fastcgi_buffer_size: 1,
            fastcgi_buffers: 1, fastcgi_busy_buffers_size: 1, fastcgi_cache: 1,
            fastcgi_cache_key: 1, fastcgi_cache_methods: 1,
            fastcgi_cache_min_uses: 1, fastcgi_cache_path: 1,
            fastcgi_cache_use_stale: 1, fastcgi_cache_valid: 1,
            fastcgi_catch_stderr: 1, fastcgi_connect_timeout: 1,
            fastcgi_hide_header: 1, fastcgi_ignore_client_abort: 1,
            fastcgi_ignore_headers: 1, fastcgi_index: 1,
            fastcgi_intercept_errors: 1, fastcgi_max_temp_file_size: 1,
            fastcgi_next_upstream: 1, fastcgi_param: 1, fastcgi_pass: 1,
            fastcgi_pass_header: 1, fastcgi_pass_request_body: 1,
            fastcgi_pass_request_headers: 1, fastcgi_read_timeout: 1,
            fastcgi_send_lowat: 1, fastcgi_send_timeout: 1,
            fastcgi_split_path_info: 1, fastcgi_store: 1, fastcgi_store_access: 1,
            fastcgi_temp_file_write_size: 1, fastcgi_temp_path: 1,
            fastcgi_upstream_fail_timeout: 1, fastcgi_upstream_max_fails: 1,
            flv: 1,  geo: 1, geoip_city: 1, geoip_country: 1, gzip: 1,
            gzip_buffers: 1, gzip_comp_level: 1, gzip_disable: 1, gzip_hash: 1,
            gzip_http_version: 1, gzip_min_length: 1, gzip_no_buffer: 1,
            gzip_proxied: 1, gzip_static: 1, gzip_types: 1, gzip_vary: 1,
            gzip_window: 1, http: 1, 'if': 1, if_modified_since: 1,
            ignore_invalid_headers: 1, image_filter: 1, image_filter_buffer: 1,
            image_filter_jpeg_quality: 1, image_filter_transparency: 1, include: 1,
            index: 1, internal: 1, ip_hash: 1, js: 1, js_load: 1, js_require: 1,
            js_utf8: 1, keepalive_requests: 1, keepalive_timeout: 1,
            kqueue_changes: 1, kqueue_events: 1, large_client_header_buffers: 1,
            limit_conn: 1, limit_conn_log_level: 1, limit_except: 1, limit_rate: 1,
            limit_rate_after: 1, limit_req: 1, limit_req_log_level: 1,
            limit_req_zone: 1, limit_zone: 1, lingering_time: 1,
            lingering_timeout: 1, listen: 1, location: 1, lock_file: 1,
            log_format: 1, log_not_found: 1, log_subrequest: 1, map: 1,
            map_hash_bucket_size: 1, map_hash_max_size: 1, master_process: 1,
            memcached_bind: 1, memcached_buffer_size: 1,
            memcached_connect_timeout: 1, memcached_next_upstream: 1,
            memcached_pass: 1, memcached_read_timeout: 1,
            memcached_send_timeout: 1, memcached_upstream_fail_timeout: 1,
            memcached_upstream_max_fails: 1, merge_slashes: 1, min_delete_depth: 1,
            modern_browser: 1, modern_browser_value: 1, more_clear_headers: 1,
            more_clear_input_headers: 1, more_set_headers: 1,
            more_set_input_headers: 1, msie_padding: 1, msie_refresh: 1,
            multi_accept: 1, open_file_cache: 1, open_file_cache_errors: 1,
            open_file_cache_events: 1, open_file_cache_min_uses: 1,
            open_file_cache_retest: 1, open_file_cache_valid: 1,
            open_log_file_cache: 1, optimize_server_names: 1, output_buffers: 1,
            override_charset: 1, perl: 1, perl_modules: 1,
            perl_require: 1, perl_set: 1, pid: 1, port_in_redirect: 1,
            post_action: 1, postpone_gzipping: 1, postpone_output: 1,
            proxy_bind: 1, proxy_buffer_size: 1, proxy_buffering: 1,
            proxy_buffers: 1, proxy_busy_buffers_size: 1, proxy_cache: 1,
            proxy_cache_key: 1, proxy_cache_methods: 1, proxy_cache_min_uses: 1,
            proxy_cache_path: 1, proxy_cache_use_stale: 1, proxy_cache_valid: 1,
            proxy_connect_timeout: 1, proxy_headers_hash_bucket_size: 1,
            proxy_headers_hash_max_size: 1, proxy_hide_header: 1,
            proxy_ignore_client_abort: 1, proxy_ignore_headers: 1,
            proxy_intercept_errors: 1, proxy_max_temp_file_size: 1,
            proxy_method: 1, proxy_next_upstream: 1, proxy_pass: 1,
            proxy_pass_header: 1, proxy_pass_request_body: 1,
            proxy_pass_request_headers: 1, proxy_read_timeout: 1,
            proxy_redirect: 1, proxy_send_lowat: 1, proxy_send_timeout: 1,
            proxy_set_body: 1, proxy_set_header: 1, proxy_store: 1,
            proxy_store_access: 1, proxy_temp_file_write_size: 1,
            proxy_temp_path: 1, proxy_upstream_fail_timeout: 1,
            proxy_upstream_max_fails: 1, push_authorized_channels_only: 1,
            push_channel_group: 1, push_max_channel_id_length: 1,
            push_max_channel_subscribers: 1, push_max_message_buffer_length: 1,
            push_max_reserved_memory: 1, push_message_buffer_length: 1,
            push_message_timeout: 1, push_min_message_buffer_length: 1,
            push_min_message_recipients: 1, push_publisher: 1,
            push_store_messages: 1, push_subscriber: 1,
            push_subscriber_concurrency: 1, random_index: 1, read_ahead: 1,
            real_ip_header: 1, recursive_error_pages: 1, request_pool_size: 1,
            reset_timedout_connection: 1, resolver: 1, resolver_timeout: 1,
            'return': 1, rewrite: 1, rewrite_log: 1, root: 1, satisfy: 1,
            satisfy_any: 1, send_lowat: 1, send_timeout: 1, sendfile: 1,
            sendfile_max_chunk: 1, server: 1, server_name: 1,
            server_name_in_redirect: 1, server_names_hash_bucket_size: 1,
            server_names_hash_max_size: 1, server_tokens: 1, 'set': 1,
            set_real_ip_from: 1, source_charset: 1, ssi: 1,
            ssi_ignore_recycled_buffers: 1, ssi_min_file_chunk: 1,
            ssi_silent_errors: 1, ssi_types: 1, ssi_value_length: 1, ssl: 1,
            ssl_certificate: 1, ssl_certificate_key: 1, ssl_ciphers: 1,
            ssl_client_certificate: 1, ssl_crl: 1, ssl_dhparam: 1,
            ssl_prefer_server_ciphers: 1, ssl_protocols: 1, ssl_session_cache: 1,
            ssl_session_timeout: 1, ssl_verify_client: 1, ssl_verify_depth: 1,
            sub_filter: 1, sub_filter_once: 1, sub_filter_types: 1, tcp_nodelay: 1,
            tcp_nopush: 1, timer_resolution: 1, try_files: 1, types: 1,
            types_hash_bucket_size: 1, types_hash_max_size: 1,
            underscores_in_headers: 1, uninitialized_variable_warn: 1, upstream: 1,
            use: 1, user: 1, userid: 1, userid_domain: 1, userid_expires: 1, userid_mark: 1,
            userid_name: 1,  userid_p3p: 1, userid_path: 1, userid_service: 1,
            valid_referers: 1, variables_hash_bucket_size: 1,
            variables_hash_max_size: 1, worker_connections: 1,
            worker_cpu_affinity: 1, worker_priority: 1, worker_processes: 1,
            worker_rlimit_core: 1, worker_rlimit_nofile: 1,
            worker_rlimit_sigpending: 1, working_directory: 1, xml_entities: 1,
            xslt_stylesheet: 1, xslt_types: 1
          },
          relevance: 0,
          contains: [
            hljs.HASH_COMMENT_MODE,
            {
              begin: '\\s', end: '[;{]', returnBegin: true, returnEnd: true,
              lexems: '[a-z/]+',
              keywords: {
                'built_in': {
                  'on': 1, 'off': 1, 'yes': 1, 'no': 1, 'true': 1, 'false': 1,
                  'none': 1, 'blocked': 1, 'debug': 1, 'info': 1, 'notice': 1,
                  'warn': 1, 'error': 1, 'crit': 1, 'select': 1, 'permanent': 1,
                  'redirect': 1, 'kqueue': 1, 'rtsig': 1, 'epoll': 1, 'poll': 1,
                  '/dev/poll': 1
                }
              },
              relevance: 0,
              contains: [
                hljs.HASH_COMMENT_MODE,
                {
                  className: 'string',
                  begin: '"', end: '"',
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3],
                  relevance: 0
                },
                {
                  className: 'string',
                  begin: "'", end: "'",
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3],
                  relevance: 0
                },
                {
                  className: 'string',
                  begin: '([a-z]+):/', end: '[;\\s]', returnEnd: true
                },
                {
                  className: 'regexp',
                  begin: "\\s\\^", end: "\\s|{|;", returnEnd: true,
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3]
                },
                // regexp locations (~, ~*)
                {
                  className: 'regexp',
                  begin: "~\\*?\\s+", end: "\\s|{|;", returnEnd: true,
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3]
                },
                // *.example.com
                {
                  className: 'regexp',
                  begin: "\\*(\\.[a-z\\-]+)+",
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3]
                },
                // sub.example.*
                {
                  className: 'regexp',
                  begin: "([a-z\\-]+\\.)+\\*",
                  contains: [hljs.BACKSLASH_ESCAPE, VAR1, VAR2, VAR3]
                },
                // IP
                {
                  className: 'number',
                  begin: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b'
                },
                // units
                {
                  className: 'number',
                  begin: '\\s\\d+[kKmMgGdshdwy]*\\b',
                  relevance: 0
                },
                VAR1, VAR2, VAR3
              ]
            }
          ]
        }
      ]
    }
  }
}();
/*
Language: Objective C
Author: Valerii Hiora <valerii.hiora@gmail.com>
*/

hljs.LANGUAGES.objectivec = function(){
  var OBJC_KEYWORDS = {
    'keyword': {
      'false': 1, 'int': 1, 'float': 1, 'while': 1, 'private': 1, 'char': 1,
      'catch': 1, 'export': 1, 'sizeof': 2, 'typedef': 2, 'const': 1,
      'struct': 1, 'for': 1, 'union': 1, 'unsigned': 1, 'long': 1,
      'volatile': 2, 'static': 1, 'protected': 1, 'bool': 1, 'mutable': 1,
      'if': 1, 'public': 1, 'do': 1, 'return': 1, 'goto': 1, 'void': 2,
      'enum': 1, 'else': 1, 'break': 1, 'extern': 1, 'true': 1, 'class': 1,
      'asm': 1, 'case': 1, 'short': 1, 'default': 1, 'double': 1, 'throw': 1,
      'register': 1, 'explicit': 1, 'signed': 1, 'typename': 1, 'try': 1,
      'this': 1, 'switch': 1, 'continue': 1, 'wchar_t': 1, 'inline': 1,
      'readonly': 1, 'assign': 1, 'property': 1, 'protocol': 10, 'self': 1,
      'synchronized': 1, 'end': 1, 'synthesize': 50, 'id': 1, 'optional': 1,
      'required': 1, 'implementation': 10, 'nonatomic': 1,'interface': 1,
      'super': 1, 'unichar': 1, 'finally': 2, 'dynamic': 2, 'nil': 1
    },
    'built_in': {
      'YES': 5, 'NO': 5, 'NULL': 1, 'IBOutlet': 50, 'IBAction': 50,
      'NSString': 50, 'NSDictionary': 50, 'CGRect': 50, 'CGPoint': 50,
      'NSRange': 50, 'release': 1, 'retain': 1, 'autorelease': 50,
      'UIButton': 50, 'UILabel': 50, 'UITextView': 50, 'UIWebView': 50,
      'MKMapView': 50, 'UISegmentedControl': 50, 'NSObject': 50,
      'UITableViewDelegate': 50, 'UITableViewDataSource': 50, 'NSThread': 50,
      'UIActivityIndicator': 50, 'UITabbar': 50, 'UIToolBar': 50,
      'UIBarButtonItem': 50, 'UIImageView': 50, 'NSAutoreleasePool': 50,
      'UITableView': 50, 'BOOL': 1, 'NSInteger': 20, 'CGFloat': 20,
      'NSException': 50, 'NSLog': 50, 'NSMutableString': 50,
      'NSMutableArray': 50, 'NSMutableDictionary': 50, 'NSURL': 50
    }
  };
  return {
    defaultMode: {
      keywords: OBJC_KEYWORDS,
      illegal: '</',
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.C_NUMBER_MODE,
        hljs.QUOTE_STRING_MODE,
        {
          className: 'string',
          begin: '\'',
          end: '[^\\\\]\'',
          illegal: '[^\\\\][^\']'
        },

        {
          className: 'preprocessor',
          begin: '#import',
          end: '$',
          contains: [
          {
            className: 'title',
            begin: '\"',
            end: '\"'
          },
          {
            className: 'title',
            begin: '<',
            end: '>'
          }
          ]
        },
        {
          className: 'preprocessor',
          begin: '#',
          end: '$'
        },
        {
          className: 'class',
          begin: 'interface|class|protocol|implementation',
          end: '({|$)',
          keywords: {
            'interface': 1,
            'class': 1,
            'protocol': 5,
            'implementation': 5
          },
          contains: [{
            className: 'id',
            begin: hljs.UNDERSCORE_IDENT_RE
          }
          ]
        }
      ]
    }
  };
}();
/*
Language: Parser3
Requires: xml.js
Author: Oleg Volchkov <oleg@volchkov.net>
*/

hljs.LANGUAGES.parser3 = {
  defaultMode: {
    subLanguage: 'html',
    contains: [
      {
        className: 'comment',
        begin: '^#', end: '$'
      },
      {
        className: 'comment',
        begin: '\\^rem{', end: '}',
        relevance: 10,
        contains: [
          {
            begin: '{', end: '}',
            contains: ['self']
          }
        ]
      },
      {
        className: 'preprocessor',
        begin: '^@(?:BASE|USE|CLASS|OPTIONS)$',
        relevance: 10
      },
      {
        className: 'title',
        begin: '@[\\w\\-]+\\[[\\w^;\\-]*\\](?:\\[[\\w^;\\-]*\\])?(?:.*)$'
      },
      {
        className: 'variable',
        begin: '\\$\\{?[\\w\\-\\.\\:]+\\}?'
      },
      {
        className: 'keyword',
        begin: '\\^[\\w\\-\\.\\:]+'
      },
      {
        className: 'number',
        begin: '\\^#[0-9a-fA-F]+'
      },
      hljs.C_NUMBER_MODE
    ]
  }
};
/*
Language: Perl
Author: Peter Leonov <gojpeg@yandex.ru>
*/

hljs.LANGUAGES.perl = function(){
  var PERL_KEYWORDS = {
    'getpwent': 1, 'getservent': 1, 'quotemeta': 1, 'msgrcv': 1, 'scalar': 1, 'kill': 1, 'dbmclose': 1, 'undef': 1,
    'lc': 1, 'ma': 1, 'syswrite': 1, 'tr': 1, 'send': 1, 'umask': 1, 'sysopen': 1, 'shmwrite': 1, 'vec': 1, 'qx': 1,
    'utime': 1, 'local': 1, 'oct': 1, 'semctl': 1, 'localtime': 1, 'readpipe': 1, 'do': 1, 'return': 1, 'format': 1,
    'read': 1, 'sprintf': 1, 'dbmopen': 1, 'pop': 1, 'getpgrp': 1, 'not': 1, 'getpwnam': 1, 'rewinddir': 1, 'qq': 1,
    'fileno': 1, 'qw': 1, 'endprotoent': 1, 'wait': 1, 'sethostent': 1, 'bless': 1, 's': 1, 'opendir': 1,
    'continue': 1, 'each': 1, 'sleep': 1, 'endgrent': 1, 'shutdown': 1, 'dump': 1, 'chomp': 1, 'connect': 1,
    'getsockname': 1, 'die': 1, 'socketpair': 1, 'close': 1, 'flock': 1, 'exists': 1, 'index': 1, 'shmget': 1,
    'sub': 1, 'for': 1, 'endpwent': 1, 'redo': 1, 'lstat': 1, 'msgctl': 1, 'setpgrp': 1, 'abs': 1, 'exit': 1,
    'select': 1, 'print': 1, 'ref': 1, 'gethostbyaddr': 1, 'unshift': 1, 'fcntl': 1, 'syscall': 1, 'goto': 1,
    'getnetbyaddr': 1, 'join': 1, 'gmtime': 1, 'symlink': 1, 'semget': 1, 'splice': 1, 'x': 1, 'getpeername': 1,
    'recv': 1, 'log': 1, 'setsockopt': 1, 'cos': 1, 'last': 1, 'reverse': 1, 'gethostbyname': 1, 'getgrnam': 1,
    'study': 1, 'formline': 1, 'endhostent': 1, 'times': 1, 'chop': 1, 'length': 1, 'gethostent': 1, 'getnetent': 1,
    'pack': 1, 'getprotoent': 1, 'getservbyname': 1, 'rand': 1, 'mkdir': 1, 'pos': 1, 'chmod': 1, 'y': 1, 'substr': 1,
    'endnetent': 1, 'printf': 1, 'next': 1, 'open': 1, 'msgsnd': 1, 'readdir': 1, 'use': 1, 'unlink': 1,
    'getsockopt': 1, 'getpriority': 1, 'rindex': 1, 'wantarray': 1, 'hex': 1, 'system': 1, 'getservbyport': 1,
    'endservent': 1, 'int': 1, 'chr': 1, 'untie': 1, 'rmdir': 1, 'prototype': 1, 'tell': 1, 'listen': 1, 'fork': 1,
    'shmread': 1, 'ucfirst': 1, 'setprotoent': 1, 'else': 1, 'sysseek': 1, 'link': 1, 'getgrgid': 1, 'shmctl': 1,
    'waitpid': 1, 'unpack': 1, 'getnetbyname': 1, 'reset': 1, 'chdir': 1, 'grep': 1, 'split': 1, 'require': 1,
    'caller': 1, 'lcfirst': 1, 'until': 1, 'warn': 1, 'while': 1, 'values': 1, 'shift': 1, 'telldir': 1, 'getpwuid': 1,
    'my': 1, 'getprotobynumber': 1, 'delete': 1, 'and': 1, 'sort': 1, 'uc': 1, 'defined': 1, 'srand': 1, 'accept': 1,
    'package': 1, 'seekdir': 1, 'getprotobyname': 1, 'semop': 1, 'our': 1, 'rename': 1, 'seek': 1, 'if': 1, 'q': 1,
    'chroot': 1, 'sysread': 1, 'setpwent': 1, 'no': 1, 'crypt': 1, 'getc': 1, 'chown': 1, 'sqrt': 1, 'write': 1,
    'setnetent': 1, 'setpriority': 1, 'foreach': 1, 'tie': 1, 'sin': 1, 'msgget': 1, 'map': 1, 'stat': 1,
    'getlogin': 1, 'unless': 1, 'elsif': 1, 'truncate': 1, 'exec': 1, 'keys': 1, 'glob': 1, 'tied': 1, 'closedir': 1,
    'ioctl': 1, 'socket': 1, 'readlink': 1, 'eval': 1, 'xor': 1, 'readline': 1, 'binmode': 1, 'setservent': 1,
    'eof': 1, 'ord': 1, 'bind': 1, 'alarm': 1, 'pipe': 1, 'atan2': 1, 'getgrent': 1, 'exp': 1, 'time': 1, 'push': 1,
    'setgrent': 1, 'gt': 1, 'lt': 1, 'or': 1, 'ne': 1, 'm': 1
  };
  var SUBST = {
    className: 'subst',
    begin: '[$@]\\{', end: '\\}',
    keywords: PERL_KEYWORDS,
    relevance: 10
  };
  var VAR1 = {
    className: 'variable',
    begin: '\\$\\d'
  };
  var VAR2 = {
    className: 'variable',
    begin: '[\\$\\%\\@\\*](\\^\\w\\b|#\\w+(\\:\\:\\w+)*|[^\\s\\w{]|{\\w+}|\\w+(\\:\\:\\w*)*)'
  };
  var STRING_CONTAINS = [hljs.BACKSLASH_ESCAPE, SUBST, VAR1, VAR2];
  var METHOD = {
    begin: '->',
    contains: [
      {begin: hljs.IDENT_RE},
      {begin: '{', end: '}'}
    ]
  };
  var COMMENT = {
    className: 'comment',
    begin: '^(__END__|__DATA__)', end: '\\n$',
    relevance: 5
  }
  var PERL_DEFAULT_CONTAINS = [
    VAR1, VAR2,
    hljs.HASH_COMMENT_MODE,
    COMMENT,
    METHOD,
    {
      className: 'string',
      begin: 'q[qwxr]?\\s*\\(', end: '\\)',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: 'q[qwxr]?\\s*\\[', end: '\\]',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: 'q[qwxr]?\\s*\\{', end: '\\}',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: 'q[qwxr]?\\s*\\|', end: '\\|',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: 'q[qwxr]?\\s*\\<', end: '\\>',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: 'qw\\s+q', end: 'q',
      contains: STRING_CONTAINS,
      relevance: 5
    },
    {
      className: 'string',
      begin: '\'', end: '\'',
      contains: [hljs.BACKSLASH_ESCAPE],
      relevance: 0
    },
    {
      className: 'string',
      begin: '"', end: '"',
      contains: STRING_CONTAINS,
      relevance: 0
    },
    {
      className: 'string',
      begin: '`', end: '`',
      contains: [hljs.BACKSLASH_ESCAPE]
    },
    {
      className: 'string',
      begin: '{\\w+}',
      relevance: 0
    },
    {
      className: 'string',
      begin: '\-?\\w+\\s*\\=\\>',
      relevance: 0
    },
    {
      className: 'number',
      begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
      relevance: 0
    },
    { // regexp container
      begin: '(' + hljs.RE_STARTERS_RE + '|split|return|print|reverse|grep)\\s*',
      keywords: {'split': 1, 'return': 1, 'print': 1, 'reverse': 1, 'grep': 1},
      relevance: 0,
      contains: [
        hljs.HASH_COMMENT_MODE,
        COMMENT,
        {
          className: 'regexp',
          begin: '(s|tr|y)/(\\\\.|[^/])*/(\\\\.|[^/])*/[a-z]*',
          relevance: 10
        },
        {
          className: 'regexp',
          begin: '(m|qr)?/', end: '/[a-z]*',
          contains: [hljs.BACKSLASH_ESCAPE],
          relevance: 0 // allows empty "//" which is a common comment delimiter in other languages
        }
      ]
    },
    {
      className: 'sub',
      begin: '\\bsub\\b', end: '(\\s*\\(.*?\\))?[;{]',
      keywords: {'sub':1},
      relevance: 5
    },
    {
      className: 'operator',
      begin: '-\\w\\b',
      relevance: 0
    },
    {
      className: 'pod',
      begin: '\\=\\w', end: '\\=cut'
    }
  ];
  SUBST.contains = PERL_DEFAULT_CONTAINS;
  METHOD.contains[1].contains = PERL_DEFAULT_CONTAINS;

  return {
    defaultMode: {
      keywords: PERL_KEYWORDS,
      contains: PERL_DEFAULT_CONTAINS
    }
  };
}();
/*
Language: PHP
Author: Victor Karamzin <Victor.Karamzin@enterra-inc.com>
Contributors: Evgeny Stepanischev <imbolk@gmail.com>
*/

hljs.LANGUAGES.php = {
  case_insensitive: true,
  defaultMode: {
    keywords: {
      'and': 1, 'include_once': 1, 'list': 1, 'abstract': 1, 'global': 1,
      'private': 1, 'echo': 1, 'interface': 1, 'as': 1, 'static': 1,
      'endswitch': 1, 'array': 1, 'null': 1, 'if': 1, 'endwhile': 1, 'or': 1,
      'const': 1, 'for': 1, 'endforeach': 1, 'self': 1, 'var': 1, 'while': 1,
      'isset': 1, 'public': 1, 'protected': 1, 'exit': 1, 'foreach': 1,
      'throw': 1, 'elseif': 1, 'extends': 1, 'include': 1, '__FILE__': 1,
      'empty': 1, 'require_once': 1, 'function': 1, 'do': 1, 'xor': 1,
      'return': 1, 'implements': 1, 'parent': 1, 'clone': 1, 'use': 1,
      '__CLASS__': 1, '__LINE__': 1, 'else': 1, 'break': 1, 'print': 1,
      'eval': 1, 'new': 1, 'catch': 1, '__METHOD__': 1, 'class': 1, 'case': 1,
      'exception': 1, 'php_user_filter': 1, 'default': 1, 'die': 1,
      'require': 1, '__FUNCTION__': 1, 'enddeclare': 1, 'final': 1, 'try': 1,
      'this': 1, 'switch': 1, 'continue': 1, 'endfor': 1, 'endif': 1,
      'declare': 1, 'unset': 1, 'true': 1, 'false': 1, 'namespace': 1, 'trait':1,
      'goto':1, 'instanceof':1, '__DIR__':1, '__NAMESPACE__':1, '__halt_compiler':1
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.HASH_COMMENT_MODE,
      {
        className: 'comment',
        begin: '/\\*', end: '\\*/',
        contains: [{
            className: 'phpdoc',
            begin: '\\s@[A-Za-z]+'
        }]
      },
      {
          className: 'comment',
          excludeBegin: true,
          begin: '__halt_compiler[^;]+;', end: '[\\n\\r]$'
      },
      hljs.C_NUMBER_MODE, // 0x..., 0..., decimal, float
      hljs.BINARY_NUMBER_MODE, // 0b...
      hljs.inherit(hljs.APOS_STRING_MODE, {illegal: null}),
      hljs.inherit(hljs.QUOTE_STRING_MODE, {illegal: null}),
      {
        className: 'string',
        begin: 'b"', end: '"',
        contains: [hljs.BACKSLASH_ESCAPE]
      },
      {
        className: 'string',
        begin: 'b\'', end: '\'',
        contains: [hljs.BACKSLASH_ESCAPE]
      },
      {
        className: 'string',
        begin: '<<<[\'"]?\\w+[\'"]?$', end: '^\\w+;',
        contains: [hljs.BACKSLASH_ESCAPE]
      },
      {
        className: 'variable',
        begin: '\\$+[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*'
      },
      {
        className: 'preprocessor',
        begin: '<\\?php',
        relevance: 10
      },
      {
        className: 'preprocessor',
        begin: '\\?>'
      }
    ]
  }
};
/*
Language: Python profile
Description: Python profiler results
Author: Brian Beck <exogen@gmail.com>
*/

hljs.LANGUAGES.profile = {
  defaultMode: {
    contains: [
      hljs.C_NUMBER_MODE,
      {
        className: 'builtin',
        begin: '{', end: '}$',
        excludeBegin: true, excludeEnd: true,
        contains: [hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE],
        relevance: 0
      },
      {
        className: 'filename',
        begin: '[a-zA-Z_][\\da-zA-Z_]+\\.[\\da-zA-Z_]{1,3}', end: ':',
        excludeEnd: true
      },
      {
        className: 'header',
        begin: '(ncalls|tottime|cumtime)', end: '$',
        keywords: {'ncalls': 1, 'tottime': 10, 'cumtime': 10, 'filename': 1},
        relevance: 10
      },
      {
        className: 'summary',
        begin: 'function calls', end: '$',
        contains: [hljs.C_NUMBER_MODE],
        relevance: 10
      },
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      {
        className: 'function',
        begin: '\\(', end: '\\)$',
        contains: [{
          className: 'title',
          begin: hljs.UNDERSCORE_IDENT_RE,
          relevance: 0
        }],
        relevance: 0
      }
    ]
  }
};
/*
Language: Python
*/

hljs.LANGUAGES.python = function() {
  var STRINGS = [
    {
      className: 'string',
      begin: '(u|b)?r?\'\'\'', end: '\'\'\'',
      relevance: 10
    },
    {
      className: 'string',
      begin: '(u|b)?r?"""', end: '"""',
      relevance: 10
    },
    {
      className: 'string',
      begin: '(u|r|ur)\'', end: '\'',
      contains: [hljs.BACKSLASH_ESCAPE],
      relevance: 10
    },
    {
      className: 'string',
      begin: '(u|r|ur)"', end: '"',
      contains: [hljs.BACKSLASH_ESCAPE],
      relevance: 10
    },
    {
      className: 'string',
      begin: '(b|br)\'', end: '\'',
      contains: [hljs.BACKSLASH_ESCAPE]
    },
    {
      className: 'string',
      begin: '(b|br)"', end: '"',
      contains: [hljs.BACKSLASH_ESCAPE]
    }
  ].concat([
    hljs.APOS_STRING_MODE,
    hljs.QUOTE_STRING_MODE
  ]);
  var TITLE = {
    className: 'title', begin: hljs.UNDERSCORE_IDENT_RE
  };
  var PARAMS = {
    className: 'params',
    begin: '\\(', end: '\\)',
    contains: STRINGS.concat([hljs.C_NUMBER_MODE])
  };

  return {
    defaultMode: {
      keywords: {
        'keyword': {
          'and': 1, 'elif': 1, 'is': 1, 'global': 1, 'as': 1, 'in': 1, 'if': 1, 'from': 1, 'raise': 1, 'for': 1,
          'except': 1, 'finally': 1, 'print': 1, 'import': 1, 'pass': 1, 'return': 1, 'exec': 1, 'else': 1,
          'break': 1, 'not': 1, 'with': 1, 'class': 1, 'assert': 1, 'yield': 1, 'try': 1, 'while': 1, 'continue': 1,
          'del': 1, 'or': 1, 'def': 1, 'lambda': 1, 'nonlocal': 10
        },
        'built_in': {'None': 1, 'True': 1, 'False': 1, 'Ellipsis': 1, 'NotImplemented': 1}
      },
      illegal: '(</|->|\\?)',
      contains: STRINGS.concat([
        hljs.HASH_COMMENT_MODE,
        {
          className: 'function',
          begin: '\\bdef ', end: ':',
          illegal: '$',
          keywords: {'def': 1},
          contains: [TITLE, PARAMS],
          relevance: 10
        },
        {
          className: 'class',
          begin: '\\bclass ', end: ':',
          illegal: '[${]',
          keywords: {'class': 1},
          contains: [TITLE, PARAMS],
          relevance: 10
        },
        hljs.C_NUMBER_MODE,
        {
          className: 'decorator',
          begin: '@', end: '$'
        }
      ])
    }
  };
}();
/*
Language: RenderMan
Description: RenderMan Languages RIB and RSL
Author: Konstantin Evdokimenko <qewerty@gmail.com>
Contributors: Shuen-Huei Guan <drake.guan@gmail.com>
*/

hljs.LANGUAGES.rib  = {
  defaultMode: {
    keywords: {
      'keyword': {
            'ArchiveRecord': 1,
            'AreaLightSource': 1,
            'Atmosphere': 1,
            'Attribute': 1,
            'AttributeBegin': 1,
            'AttributeEnd': 1,
            'Basis': 1,
            'Begin': 1,
            'Blobby': 1,
            'Bound': 1,
            'Clipping': 1,
            'ClippingPlane': 1,
            'Color': 1,
            'ColorSamples': 1,
            'ConcatTransform': 1,
            'Cone': 1,
            'CoordinateSystem': 1,
            'CoordSysTransform': 1,
            'CropWindow': 1,
            'Curves': 1,
            'Cylinder': 1,
            'DepthOfField': 1,
            'Detail': 1,
            'DetailRange': 1,
            'Disk': 1,
            'Displacement': 1,
            'Display': 1,
            'End': 1,
            'ErrorHandler': 1,
            'Exposure': 1,
            'Exterior': 1,
            'Format': 1,
            'FrameAspectRatio': 1,
            'FrameBegin': 1,
            'FrameEnd': 1,
            'GeneralPolygon': 1,
            'GeometricApproximation': 1,
            'Geometry': 1,
            'Hider': 1,
            'Hyperboloid': 1,
            'Identity': 1,
            'Illuminate': 1,
            'Imager': 1,
            'Interior': 1,
            'LightSource': 1,
            'MakeCubeFaceEnvironment': 1,
            'MakeLatLongEnvironment': 1,
            'MakeShadow': 1,
            'MakeTexture': 1,
            'Matte': 1,
            'MotionBegin': 1,
            'MotionEnd': 1,
            'NuPatch': 1,
            'ObjectBegin': 1,
            'ObjectEnd': 1,
            'ObjectInstance': 1,
            'Opacity': 1,
            'Option': 1,
            'Orientation': 1,
            'Paraboloid': 1,
            'Patch': 1,
            'PatchMesh': 1,
            'Perspective': 1,
            'PixelFilter': 1,
            'PixelSamples': 1,
            'PixelVariance': 1,
            'Points': 1,
            'PointsGeneralPolygons': 1,
            'PointsPolygons': 1,
            'Polygon': 1,
            'Procedural': 1,
            'Projection': 1,
            'Quantize': 1,
            'ReadArchive': 1,
            'RelativeDetail': 1,
            'ReverseOrientation': 1,
            'Rotate': 1,
            'Scale': 1,
            'ScreenWindow': 1,
            'ShadingInterpolation': 1,
            'ShadingRate': 1,
            'Shutter': 1,
            'Sides': 1,
            'Skew': 1,
            'SolidBegin': 1,
            'SolidEnd': 1,
            'Sphere': 1,
            'SubdivisionMesh': 1,
            'Surface': 1,
            'TextureCoordinates': 1,
            'Torus': 1,
            'Transform': 1,
            'TransformBegin': 1,
            'TransformEnd': 1,
            'TransformPoints': 1,
            'Translate': 1,
            'TrimCurve': 1,
            'WorldBegin': 1,
            'WorldEnd': 1
            }
    },
    illegal: '</',
    contains: [
      hljs.HASH_COMMENT_MODE,
      hljs.C_NUMBER_MODE,
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE
    ]
  }
};

hljs.LANGUAGES.rsl  = {
  defaultMode: {
    keywords: {
      'keyword': {'float': 1, 'color': 1, 'point': 1, 'normal': 1, 'vector': 1,
                  'matrix': 1, 'while': 1, 'for': 1, 'if': 1, 'do': 1,
                  'return': 1, 'else': 1, 'break': 1, 'extern': 1, 'continue': 1},
      'built_in': {
                    'abs': 1,
                    'acos': 1,
                    'ambient': 1,
                    'area': 1,
                    'asin': 1,
                    'atan': 1,
                    'atmosphere': 1,
                    'attribute': 1,
                    'calculatenormal': 1,
                    'ceil': 1,
                    'cellnoise': 1,
                    'clamp': 1,
                    'comp': 1,
                    'concat': 1,
                    'cos': 1,
                    'degrees': 1,
                    'depth': 1,
                    'Deriv': 1,
                    'diffuse': 1,
                    'distance': 1,
                    'Du': 1,
                    'Dv': 1,
                    'environment': 1,
                    'exp': 1,
                    'faceforward': 1,
                    'filterstep': 1,
                    'floor': 1,
                    'format': 1,
                    'fresnel': 1,
                    'incident': 1,
                    'length': 1,
                    'lightsource': 1,
                    'log': 1,
                    'match': 1,
                    'max': 1,
                    'min': 1,
                    'mod': 1,
                    'noise': 1,
                    'normalize': 1,
                    'ntransform': 1,
                    'opposite': 1,
                    'option': 1,
                    'phong': 1,
                    'pnoise': 1,
                    'pow': 1,
                    'printf': 1,
                    'ptlined': 1,
                    'radians': 1,
                    'random': 1,
                    'reflect': 1,
                    'refract': 1,
                    'renderinfo': 1,
                    'round': 1,
                    'setcomp': 1,
                    'setxcomp': 1,
                    'setycomp': 1,
                    'setzcomp': 1,
                    'shadow': 1,
                    'sign': 1,
                    'sin': 1,
                    'smoothstep': 1,
                    'specular': 1,
                    'specularbrdf': 1,
                    'spline': 1,
                    'sqrt': 1,
                    'step': 1,
                    'tan': 1,
                    'texture': 1,
                    'textureinfo': 1,
                    'trace': 1,
                    'transform': 1,
                    'vtransform': 1,
                    'xcomp': 1,
                    'ycomp': 1,
                    'zcomp': 1
                    }
    },
    illegal: '</',
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.APOS_STRING_MODE,
      hljs.C_NUMBER_MODE,
      {
        className: 'preprocessor',
        begin: '#', end: '$'
      },
      {
        className: 'shader',
        begin: 'surface |displacement |light |volume |imager ', end: '\\(',
        keywords: {'surface': 1, 'displacement': 1, 'light': 1, 'volume': 1, 'imager': 1}
      },
      {
        className: 'shading',
        begin: 'illuminate|illuminance|gather', end: '\\(',
        keywords: {'illuminate': 1, 'illuminance': 1, 'gather': 1}
      }
    ]
  }
};
/*
Language: Ruby
Author: Anton Kovalyov <anton@kovalyov.net>
Contributors: Peter Leonov <gojpeg@yandex.ru>, Vasily Polovnyov <vast@whiteants.net>, Loren Segal <lsegal@soen.ca>
*/

hljs.LANGUAGES.ruby = function(){
  var RUBY_IDENT_RE = '[a-zA-Z_][a-zA-Z0-9_]*(\\!|\\?)?';
  var RUBY_METHOD_RE = '[a-zA-Z_]\\w*[!?=]?|[-+~]\\@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?';
  var RUBY_KEYWORDS = {
    'keyword': {
      'and': 1, 'false': 1, 'then': 1, 'defined': 1, 'module': 1, 'in': 1, 'return': 1, 'redo': 1, 'if': 1,
      'BEGIN': 1, 'retry': 1, 'end': 1, 'for': 1, 'true': 1, 'self': 1, 'when': 1, 'next': 1, 'until': 1, 'do': 1,
      'begin': 1, 'unless': 1, 'END': 1, 'rescue': 1, 'nil': 1, 'else': 1, 'break': 1, 'undef': 1, 'not': 1,
      'super': 1, 'class': 1, 'case': 1, 'require': 1, 'yield': 1, 'alias': 1, 'while': 1, 'ensure': 1,
      'elsif': 1, 'or': 1, 'def': 1
    },
    'keymethods': {
      '__id__': 1, '__send__': 1, 'abort': 1, 'abs': 1, 'all?': 1, 'allocate': 1, 'ancestors': 1, 'any?': 1,
      'arity': 1, 'assoc': 1, 'at': 1, 'at_exit': 1, 'autoload': 1, 'autoload?': 1, 'between?': 1, 'binding': 1,
      'binmode': 1, 'block_given?': 1, 'call': 1, 'callcc': 1, 'caller': 1, 'capitalize': 1, 'capitalize!': 1,
      'casecmp': 1, 'catch': 1, 'ceil': 1, 'center': 1, 'chomp': 1, 'chomp!': 1, 'chop': 1, 'chop!': 1, 'chr': 1,
      'class': 1, 'class_eval': 1, 'class_variable_defined?': 1, 'class_variables': 1, 'clear': 1, 'clone': 1,
      'close': 1, 'close_read': 1, 'close_write': 1, 'closed?': 1, 'coerce': 1, 'collect': 1, 'collect!': 1,
      'compact': 1, 'compact!': 1, 'concat': 1, 'const_defined?': 1, 'const_get': 1, 'const_missing': 1,
      'const_set': 1, 'constants': 1, 'count': 1, 'crypt': 1, 'default': 1, 'default_proc': 1, 'delete': 1,
      'delete!': 1, 'delete_at': 1, 'delete_if': 1, 'detect': 1, 'display': 1, 'div': 1, 'divmod': 1,
      'downcase': 1, 'downcase!': 1, 'downto': 1, 'dump': 1, 'dup': 1, 'each': 1, 'each_byte': 1,
      'each_index': 1, 'each_key': 1, 'each_line': 1, 'each_pair': 1, 'each_value': 1, 'each_with_index': 1,
      'empty?': 1, 'entries': 1, 'eof': 1, 'eof?': 1, 'eql?': 1, 'equal?': 1, 'eval': 1, 'exec': 1, 'exit': 1,
      'exit!': 1, 'extend': 1, 'fail': 1, 'fcntl': 1, 'fetch': 1, 'fileno': 1, 'fill': 1, 'find': 1, 'find_all': 1,
      'first': 1, 'flatten': 1, 'flatten!': 1, 'floor': 1, 'flush': 1, 'for_fd': 1, 'foreach': 1, 'fork': 1,
      'format': 1, 'freeze': 1, 'frozen?': 1, 'fsync': 1, 'getc': 1, 'gets': 1, 'global_variables': 1, 'grep': 1,
      'gsub': 1, 'gsub!': 1, 'has_key?': 1, 'has_value?': 1, 'hash': 1, 'hex': 1, 'id': 1, 'include': 1,
      'include?': 1, 'included_modules': 1, 'index': 1, 'indexes': 1, 'indices': 1, 'induced_from': 1,
      'inject': 1, 'insert': 1, 'inspect': 1, 'instance_eval': 1, 'instance_method': 1, 'instance_methods': 1,
      'instance_of?': 1, 'instance_variable_defined?': 1, 'instance_variable_get': 1, 'instance_variable_set': 1,
      'instance_variables': 1, 'integer?': 1, 'intern': 1, 'invert': 1, 'ioctl': 1, 'is_a?': 1, 'isatty': 1,
      'iterator?': 1, 'join': 1, 'key?': 1, 'keys': 1, 'kind_of?': 1, 'lambda': 1, 'last': 1, 'length': 1,
      'lineno': 1, 'ljust': 1, 'load': 1, 'local_variables': 1, 'loop': 1, 'lstrip': 1, 'lstrip!': 1, 'map': 1,
      'map!': 1, 'match': 1, 'max': 1, 'member?': 1, 'merge': 1, 'merge!': 1, 'method': 1, 'method_defined?': 1,
      'method_missing': 1, 'methods': 1, 'min': 1, 'module_eval': 1, 'modulo': 1, 'name': 1, 'nesting': 1, 'new': 1,
      'next': 1, 'next!': 1, 'nil?': 1, 'nitems': 1, 'nonzero?': 1, 'object_id': 1, 'oct': 1, 'open': 1, 'pack': 1,
      'partition': 1, 'pid': 1, 'pipe': 1, 'pop': 1, 'popen': 1, 'pos': 1, 'prec': 1, 'prec_f': 1, 'prec_i': 1,
      'print': 1, 'printf': 1, 'private_class_method': 1, 'private_instance_methods': 1, 'private_method_defined?': 1,
      'private_methods': 1, 'proc': 1, 'protected_instance_methods': 1, 'protected_method_defined?': 1,
      'protected_methods': 1, 'public_class_method': 1, 'public_instance_methods': 1, 'public_method_defined?': 1,
      'public_methods': 1, 'push': 1, 'putc': 1, 'puts': 1, 'quo': 1, 'raise': 1, 'rand': 1, 'rassoc': 1, 'read': 1,
      'read_nonblock': 1, 'readchar': 1, 'readline': 1, 'readlines': 1, 'readpartial': 1, 'rehash': 1, 'reject': 1,
      'reject!': 1, 'remainder': 1, 'reopen': 1, 'replace': 1, 'require': 1, 'respond_to?': 1, 'reverse': 1,
      'reverse!': 1, 'reverse_each': 1, 'rewind': 1, 'rindex': 1, 'rjust': 1, 'round': 1, 'rstrip': 1, 'rstrip!': 1,
      'scan': 1, 'seek': 1, 'select': 1, 'send': 1, 'set_trace_func': 1, 'shift': 1, 'singleton_method_added': 1,
      'singleton_methods': 1, 'size': 1, 'sleep': 1, 'slice': 1, 'slice!': 1, 'sort': 1, 'sort!': 1, 'sort_by': 1,
      'split': 1, 'sprintf': 1, 'squeeze': 1, 'squeeze!': 1, 'srand': 1, 'stat': 1, 'step': 1, 'store': 1, 'strip': 1,
      'strip!': 1, 'sub': 1, 'sub!': 1, 'succ': 1, 'succ!': 1, 'sum': 1, 'superclass': 1, 'swapcase': 1, 'swapcase!': 1,
      'sync': 1, 'syscall': 1, 'sysopen': 1, 'sysread': 1, 'sysseek': 1, 'system': 1, 'syswrite': 1, 'taint': 1,
      'tainted?': 1, 'tell': 1, 'test': 1, 'throw': 1, 'times': 1, 'to_a': 1, 'to_ary': 1, 'to_f': 1, 'to_hash': 1,
      'to_i': 1, 'to_int': 1, 'to_io': 1, 'to_proc': 1, 'to_s': 1, 'to_str': 1, 'to_sym': 1, 'tr': 1, 'tr!': 1,
      'tr_s': 1, 'tr_s!': 1, 'trace_var': 1, 'transpose': 1, 'trap': 1, 'truncate': 1, 'tty?': 1, 'type': 1,
      'ungetc': 1, 'uniq': 1, 'uniq!': 1, 'unpack': 1, 'unshift': 1, 'untaint': 1, 'untrace_var': 1, 'upcase': 1,
      'upcase!': 1, 'update': 1, 'upto': 1, 'value?': 1, 'values': 1, 'values_at': 1, 'warn': 1, 'write': 1,
      'write_nonblock': 1, 'zero?': 1, 'zip': 1
    }
  };
  var YARDOCTAG = {
    className: 'yardoctag',
    begin: '@[A-Za-z]+'
  };
  var COMMENTS = [
    {
      className: 'comment',
      begin: '#', end: '$',
      contains: [YARDOCTAG]
    },
    {
      className: 'comment',
      begin: '^\\=begin', end: '^\\=end',
      contains: [YARDOCTAG],
      relevance: 10
    },
    {
      className: 'comment',
      begin: '^__END__', end: '\\n$'
    }
  ];
  var SUBST = {
    className: 'subst',
    begin: '#\\{', end: '}',
    lexems: RUBY_IDENT_RE,
    keywords: RUBY_KEYWORDS
  };
  var STR_CONTAINS = [hljs.BACKSLASH_ESCAPE, SUBST];
  var STRINGS = [
    {
      className: 'string',
      begin: '\'', end: '\'',
      contains: STR_CONTAINS,
      relevance: 0
    },
    {
      className: 'string',
      begin: '"', end: '"',
      contains: STR_CONTAINS,
      relevance: 0
    },
    {
      className: 'string',
      begin: '%[qw]?\\(', end: '\\)',
      contains: STR_CONTAINS,
      relevance: 10
    },
    {
      className: 'string',
      begin: '%[qw]?\\[', end: '\\]',
      contains: STR_CONTAINS,
      relevance: 10
    },
    {
      className: 'string',
      begin: '%[qw]?{', end: '}',
      contains: STR_CONTAINS,
      relevance: 10
    },
    {
      className: 'string',
      begin: '%[qw]?<', end: '>',
      contains: STR_CONTAINS,
      relevance: 10
    },
    {
      className: 'string',
      begin: '%[qw]?/', end: '/',
      contains: STR_CONTAINS,
      relevance: 10
    },
    {
      className: 'string',
      begin: '%[qw]?%', end: '%',
      contains: STR_CONTAINS,
      relevance: 10
    },
    {
      className: 'string',
      begin: '%[qw]?-', end: '-',
      contains: STR_CONTAINS,
      relevance: 10
    },
    {
      className: 'string',
      begin: '%[qw]?\\|', end: '\\|',
      contains: STR_CONTAINS,
      relevance: 10
    }
  ];
  var FUNCTION = {
    className: 'function',
    begin: '\\bdef\\s+', end: ' |$|;',
    lexems: RUBY_IDENT_RE,
    keywords: RUBY_KEYWORDS,
    contains: [
      {
        className: 'title',
        begin: RUBY_METHOD_RE,
        lexems: RUBY_IDENT_RE,
        keywords: RUBY_KEYWORDS
      },
      {
        className: 'params',
        begin: '\\(', end: '\\)',
        lexems: RUBY_IDENT_RE,
        keywords: RUBY_KEYWORDS
      }
    ].concat(COMMENTS)
  };
  var IDENTIFIER = {
    className: 'identifier',
    begin: RUBY_IDENT_RE,
    lexems: RUBY_IDENT_RE,
    keywords: RUBY_KEYWORDS,
    relevance: 0
  };

  var RUBY_DEFAULT_CONTAINS = COMMENTS.concat(STRINGS.concat([
    {
      className: 'class',
      begin: '\\b(class|module)\\b', end: '$|;',
      keywords: {'class': 1, 'module': 1},
      contains: [
        {
          className: 'title',
          begin: '[A-Za-z_]\\w*(::\\w+)*(\\?|\\!)?',
          relevance: 0
        },
        {
          className: 'inheritance',
          begin: '<\\s*',
          contains: [{
            className: 'parent',
            begin: '(' + hljs.IDENT_RE + '::)?' + hljs.IDENT_RE
          }]
        }
      ].concat(COMMENTS)
    },
    FUNCTION,
    {
      className: 'constant',
      begin: '(::)?([A-Z]\\w*(::)?)+',
      relevance: 0
    },
    {
      className: 'symbol',
      begin: ':',
      contains: STRINGS.concat([IDENTIFIER]),
      relevance: 0
    },
    {
      className: 'number',
      begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
      relevance: 0
    },
    {
      className: 'number',
      begin: '\\?\\w'
    },
    {
      className: 'variable',
      begin: '(\\$\\W)|((\\$|\\@\\@?)(\\w+))'
    },
    IDENTIFIER,
    { // regexp container
      begin: '(' + hljs.RE_STARTERS_RE + ')\\s*',
      contains: COMMENTS.concat([
        {
          className: 'regexp',
          begin: '/', end: '/[a-z]*',
          illegal: '\\n',
          contains: [hljs.BACKSLASH_ESCAPE]
        }
      ]),
      relevance: 0
    }
  ]));
  SUBST.contains = RUBY_DEFAULT_CONTAINS;
  FUNCTION.contains[1].contains = RUBY_DEFAULT_CONTAINS;

  return {
    defaultMode: {
      lexems: RUBY_IDENT_RE,
      keywords: RUBY_KEYWORDS,
      contains: RUBY_DEFAULT_CONTAINS
    }
  };
}();
/*
Language: Rust
Author: Andrey Vlasovskikh <andrey.vlasovskikh@gmail.com>
*/

hljs.LANGUAGES.rust = function() {
  var TITLE = {
    className: 'title',
    begin: hljs.UNDERSCORE_IDENT_RE
  };
  var QUOTE_STRING = {
    className: 'string',
    begin: '"', end: '"',
    contains: [hljs.BACKSLASH_ESCAPE],
    relevance: 0
  };
  var NUMBER = {
    className: 'number',
    begin: '\\b(0[xb][A-Za-z0-9_]+|[0-9_]+(\\.[0-9_]+)?([uif](8|16|32|64)?)?)',
    relevance: 0
  };
  var KEYWORDS = {
    'alt': 1, 'any': 1, 'as': 1, 'assert': 1,
    'be': 1, 'bind': 1, 'block': 1, 'bool': 1, 'break': 1,
    'char': 1, 'check': 1, 'claim': 1, 'const': 1, 'cont': 1,
    'dir': 1, 'do': 1,
    'else': 1, 'enum': 1, 'export': 1,
    'f32': 1, 'f64': 1, 'fail': 1, 'false': 1, 'float': 1, 'fn': 10, 'for': 1,
    'i16': 1, 'i32': 1, 'i64': 1, 'i8': 1, 'if': 1, 'iface': 10, 'impl': 10, 'import': 1, 'in': 1, 'int': 1,
    'let': 1, 'log': 1,
    'mod': 1, 'mutable': 1,
    'native': 1, 'note': 1,
    'of': 1,
    'prove': 1, 'pure': 10,
    'resource': 1, 'ret': 1,
    'self': 1, 'str': 1, 'syntax': 1,
    'true': 1, 'type': 1,
    'u16': 1, 'u32': 1, 'u64': 1, 'u8': 1, 'uint': 1, 'unchecked': 1, 'unsafe': 1, 'use': 1,
    'vec': 1,
    'while': 1
  };
  return {
    defaultMode: {
      keywords: KEYWORDS,
      illegal: '</',
      contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        QUOTE_STRING,
        hljs.APOS_STRING_MODE,
        NUMBER,
        {
          className: 'function',
          begin: 'fn', end: '(\\(|<)',
          keywords: {'fn': 1},
          contains: [TITLE]
        },
        {
          className: 'preprocessor',
          begin: '#\\[', end: '\\]'
        },
        {
          begin: 'type', end: '(=|<)',
          keywords: {'type': 1},
          contains: [TITLE]
        },
        {
          begin: 'iface', end: '({|<)',
          keywords: {'iface': 1},
          contains: [TITLE]
        },
        {
          begin: 'enum', end: '({|<)',
          keywords: {'enum': 1},
          contains: [TITLE]
        }
      ]
    }
  };
}();
/*
Language: Scala
Author: Jan Berkel <jan.berkel@gmail.com>
*/

hljs.LANGUAGES.scala = function() {
  var ANNOTATION = {
    className: 'annotation', begin: '@[A-Za-z]+'
  };
  var STRING = {
    className: 'string',
    begin: 'u?r?"""', end: '"""',
    relevance: 10
  };
  return {
    defaultMode: {
      keywords: {
        'type': 1, 'yield': 1, 'lazy': 1, 'override': 1, 'def': 1, 'with': 1, 'val':1, 'var': 1, 'false': 1, 'true': 1,
        'sealed': 1, 'abstract': 1, 'private': 1, 'trait': 1,  'object': 1, 'null': 1, 'if': 1, 'for': 1, 'while': 1,
        'throw': 1, 'finally': 1, 'protected': 1, 'extends': 1, 'import': 1, 'final': 1, 'return': 1, 'else': 1,
        'break': 1, 'new': 1, 'catch': 1, 'super': 1, 'class': 1, 'case': 1,'package': 1, 'default': 1, 'try': 1,
        'this': 1, 'match': 1, 'continue': 1, 'throws': 1
      },
      contains: [
        {
          className: 'javadoc',
          begin: '/\\*\\*', end: '\\*/',
          contains: [{
            className: 'javadoctag',
            begin: '@[A-Za-z]+'
          }],
          relevance: 10
        },
        hljs.C_LINE_COMMENT_MODE, hljs.C_BLOCK_COMMENT_MODE,
        hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, STRING,
        {
          className: 'class',
          begin: '((case )?class |object |trait )', end: '({|$)',
          illegal: ':',
          keywords: {'case' : 1, 'class': 1, 'trait': 1, 'object': 1},
          contains: [
            {
              begin: '(extends|with)',
              keywords: {'extends': 1, 'with': 1},
              relevance: 10
            },
            {
              className: 'title',
              begin: hljs.UNDERSCORE_IDENT_RE
            },
            {
              className: 'params',
              begin: '\\(', end: '\\)',
              contains: [
                hljs.APOS_STRING_MODE, hljs.QUOTE_STRING_MODE, STRING,
                ANNOTATION
              ]
            }
          ]
        },
        hljs.C_NUMBER_MODE,
        ANNOTATION
      ]
    }
  };
}();
/*
Language: Smalltalk
Author: Vladimir Gubarkov <xonixx@gmail.com>
*/

hljs.LANGUAGES.smalltalk = function() {
  var VAR_IDENT_RE = '[a-z][a-zA-Z0-9_]*';
  var CHAR = {
    className: 'char',
    begin: '\\$.{1}'
  };
  var SYMBOL = {
    className: 'symbol',
    begin: '#' + hljs.UNDERSCORE_IDENT_RE
  };
  return {
    defaultMode: {
      keywords: {'self': 1, 'super': 1, 'nil': 1, 'true': 1, 'false': 1, 'thisContext': 1}, // only 6
      contains: [
        {
          className: 'comment',
          begin: '"', end: '"',
          relevance: 0
        },
        hljs.APOS_STRING_MODE,
        {
          className: 'class',
          begin: '\\b[A-Z][A-Za-z0-9_]*',
          relevance: 0
        },
        {
          className: 'method',
          begin: VAR_IDENT_RE + ':'
        },
        hljs.C_NUMBER_MODE,
        SYMBOL,
        CHAR,
        {
          className: 'localvars',
          begin: '\\|\\s*((' + VAR_IDENT_RE + ')\\s*)+\\|'
        },
        {
          className: 'array',
          begin: '\\#\\(', end: '\\)',
          contains: [
            hljs.APOS_STRING_MODE,
            CHAR,
            hljs.C_NUMBER_MODE,
            SYMBOL
          ]
        }
      ]
    }
  };
}();
/*
Language: SQL
*/

hljs.LANGUAGES.sql = {
  case_insensitive: true,
  defaultMode: {
    illegal: '[^\\s]',
    contains: [
      {
        className: 'operator',
        begin: '(begin|start|commit|rollback|savepoint|lock|alter|create|drop|rename|call|delete|do|handler|insert|load|replace|select|truncate|update|set|show|pragma|grant)\\b', end: ';|$',
        keywords: {
          'keyword': {
            'all': 1, 'partial': 1, 'global': 1, 'month': 1,
            'current_timestamp': 1, 'using': 1, 'go': 1, 'revoke': 1,
            'smallint': 1, 'indicator': 1, 'end-exec': 1, 'disconnect': 1,
            'zone': 1, 'with': 1, 'character': 1, 'assertion': 1, 'to': 1,
            'add': 1, 'current_user': 1, 'usage': 1, 'input': 1, 'local': 1,
            'alter': 1, 'match': 1, 'collate': 1, 'real': 1, 'then': 1,
            'rollback': 1, 'get': 1, 'read': 1, 'timestamp': 1,
            'session_user': 1, 'not': 1, 'integer': 1, 'bit': 1, 'unique': 1,
            'day': 1, 'minute': 1, 'desc': 1, 'insert': 1, 'execute': 1,
            'like': 1, 'ilike': 2, 'level': 1, 'decimal': 1, 'drop': 1,
            'continue': 1, 'isolation': 1, 'found': 1, 'where': 1,
            'constraints': 1, 'domain': 1, 'right': 1, 'national': 1, 'some': 1,
            'module': 1, 'transaction': 1, 'relative': 1, 'second': 1,
            'connect': 1, 'escape': 1, 'close': 1, 'system_user': 1, 'for': 1,
            'deferred': 1, 'section': 1, 'cast': 1, 'current': 1, 'sqlstate': 1,
            'allocate': 1, 'intersect': 1, 'deallocate': 1, 'numeric': 1,
            'public': 1, 'preserve': 1, 'full': 1, 'goto': 1, 'initially': 1,
            'asc': 1, 'no': 1, 'key': 1, 'output': 1, 'collation': 1, 'group': 1,
            'by': 1, 'union': 1, 'session': 1, 'both': 1, 'last': 1,
            'language': 1, 'constraint': 1, 'column': 1, 'of': 1, 'space': 1,
            'foreign': 1, 'deferrable': 1, 'prior': 1, 'connection': 1,
            'unknown': 1, 'action': 1, 'commit': 1, 'view': 1, 'or': 1,
            'first': 1, 'into': 1, 'float': 1, 'year': 1, 'primary': 1,
            'cascaded': 1, 'except': 1, 'restrict': 1, 'set': 1, 'references': 1,
            'names': 1, 'table': 1, 'outer': 1, 'open': 1, 'select': 1,
            'size': 1, 'are': 1, 'rows': 1, 'from': 1, 'prepare': 1,
            'distinct': 1, 'leading': 1, 'create': 1, 'only': 1, 'next': 1,
            'inner': 1, 'authorization': 1, 'schema': 1, 'corresponding': 1,
            'option': 1, 'declare': 1, 'precision': 1, 'immediate': 1, 'else': 1,
            'timezone_minute': 1, 'external': 1, 'varying': 1, 'translation': 1,
            'true': 1, 'case': 1, 'exception': 1, 'join': 1, 'hour': 1,
            'default': 1, 'double': 1, 'scroll': 1, 'value': 1, 'cursor': 1,
            'descriptor': 1, 'values': 1, 'dec': 1, 'fetch': 1, 'procedure': 1,
            'delete': 1, 'and': 1, 'false': 1, 'int': 1, 'is': 1, 'describe': 1,
            'char': 1, 'as': 1, 'at': 1, 'in': 1, 'varchar': 1, 'null': 1,
            'trailing': 1, 'any': 1, 'absolute': 1, 'current_time': 1, 'end': 1,
            'grant': 1, 'privileges': 1, 'when': 1, 'cross': 1, 'check': 1,
            'write': 1, 'current_date': 1, 'pad': 1, 'begin': 1, 'temporary': 1,
            'exec': 1, 'time': 1, 'update': 1, 'catalog': 1, 'user': 1, 'sql': 1,
            'date': 1, 'on': 1, 'identity': 1, 'timezone_hour': 1, 'natural': 1,
            'whenever': 1, 'interval': 1, 'work': 1, 'order': 1, 'cascade': 1,
            'diagnostics': 1, 'nchar': 1, 'having': 1, 'left': 1, 'call': 1,
            'do': 1, 'handler': 1, 'load': 1, 'replace': 1, 'truncate': 1,
            'start': 1, 'lock': 1, 'show': 1, 'pragma': 1},
          'aggregate': {'count': 1, 'sum': 1, 'min': 1, 'max': 1, 'avg': 1}
        },
        contains: [
          {
            className: 'string',
            begin: '\'', end: '\'',
            contains: [hljs.BACKSLASH_ESCAPE, {begin: '\'\''}],
            relevance: 0
          },
          {
            className: 'string',
            begin: '"', end: '"',
            contains: [hljs.BACKSLASH_ESCAPE, {begin: '""'}],
            relevance: 0
          },
          {
            className: 'string',
            begin: '`', end: '`',
            contains: [hljs.BACKSLASH_ESCAPE]
          },
          hljs.C_NUMBER_MODE,
          {begin: '\\n'}
        ]
      },
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: 'comment',
        begin: '--', end: '$'
      }
    ]
  }
};
/*
Language: TeX
Author: Vladimir Moskva <vladmos@gmail.com>
Website: http://fulc.ru/
*/

hljs.LANGUAGES.tex = function() {
  var COMMAND1 = {
    className: 'command',
    begin: '\\\\[a-zA-Zа-яА-я]+[\\*]?',
    relevance: 10
  };
  var COMMAND2 = {
    className: 'command',
    begin: '\\\\[^a-zA-Zа-яА-я0-9]',
    relevance: 0
  };
  var SPECIAL = {
    className: 'special',
    begin: '[{}\\[\\]\\&#~]',
    relevance: 0
  };

  return {
    defaultMode: {
      contains: [
        { // parameter
          begin: '\\\\[a-zA-Zа-яА-я]+[\\*]? *= *-?\\d*\\.?\\d+(pt|pc|mm|cm|in|dd|cc|ex|em)?',
          returnBegin: true,
          contains: [
            COMMAND1, COMMAND2,
            {
              className: 'number',
              begin: ' *=', end: '-?\\d*\\.?\\d+(pt|pc|mm|cm|in|dd|cc|ex|em)?',
              excludeBegin: true
            }
          ],
          relevance: 10
        },
        COMMAND1, COMMAND2,
        SPECIAL,
        {
          className: 'formula',
          begin: '\\$\\$', end: '\\$\\$',
          contains: [COMMAND1, COMMAND2, SPECIAL],
          relevance: 0
        },
        {
          className: 'formula',
          begin: '\\$', end: '\\$',
          contains: [COMMAND1, COMMAND2, SPECIAL],
          relevance: 0
        },
        {
          className: 'comment',
          begin: '%', end: '$',
          relevance: 0
        }
      ]
    }
  };
}();
/*
Language: Vala
Author: Antono Vasiljev <antono.vasiljev@gmail.com>
Description: Vala is a new programming language that aims to bring modern programming language features to GNOME developers without imposing any additional runtime requirements and without using a different ABI compared to applications and libraries written in C.
*/

hljs.LANGUAGES.vala = {
  defaultMode: {
    keywords: {
      keyword: {
        // Value types
        'char': 1, 'uchar': 1, 'unichar': 1,
        'int': 1, 'uint': 1, 'long': 1, 'ulong': 1,
        'short': 1, 'ushort': 1,
        'int8': 1, 'int16': 1, 'int32': 1, 'int64': 1,
        'uint8': 1, 'uint16': 1, 'uint32': 1, 'uint64': 1,
        'float': 1, 'double': 1, 'bool': 1, 'struct': 1, 'enum': 1,
        'string': 1, 'void': 1,
        // Reference types
        'weak': 5, 'unowned': 5, 'owned': 5,
        // Modifiers
        'async': 5, 'signal': 5, 'static': 1, 'abstract': 1, 'interface': 1, 'override': 1,
        // Control Structures
        'while': 1, 'do': 1, 'for': 1, 'foreach': 1, 'else': 1, 'switch': 1,
        'case': 1, 'break': 1, 'default': 1, 'return': 1, 'try': 1, 'catch': 1,
        // Visibility
        'public': 1, 'private': 1, 'protected': 1, 'internal': 1,
        // Other
        'using': 1, 'new': 1, 'this': 1, 'get': 1, 'set': 1, 'const': 1,
        'stdout': 1, 'stdin': 1, 'stderr': 1, 'var': 1,
        // Builtins
        'DBus': 2, 'GLib': 2, 'CCode': 10, 'Gee': 10, 'Object': 1
      },
      literal: { 'false': 1, 'true': 1, 'null': 1 }
    },
    contains: [
      {
        className: 'class',
        begin: '(class |interface |delegate |namespace )', end: '{',
        keywords: {'class': 1, 'interface': 1},
        contains: [
          {
            begin: '(implements|extends)',
            keywords: {'extends': 1, 'implements': 1}
          },
          {
            className: 'title',
            begin: hljs.UNDERSCORE_IDENT_RE
          }
        ]
      },
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: 'string',
        begin: '"""', end: '"""',
        relevance: 5
      },
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.C_NUMBER_MODE,
      {
        className: 'preprocessor',
        begin: '^#', end: '$',
        relevance: 2
      },
      {
        className: 'constant',
        begin: ' [A-Z_]+ ',
        relevance: 0
      }
    ]
  }
};
/*
Language: VBScript
Author: Nikita Ledyaev <lenikita@yandex.ru>
Contributors: Michal Gabrukiewicz <mgabru@gmail.com>
*/

hljs.LANGUAGES.vbscript = {
  case_insensitive: true,
  defaultMode: {
    keywords: {
      'keyword': {
        'call': 1, 'class': 1, 'const': 1, 'dim': 1, 'do': 1, 'loop': 1, 'erase': 1, 'execute': 1, 'executeglobal': 1,
        'exit': 1, 'for': 1, 'each': 1, 'next': 1, 'function': 1, 'if': 1, 'then': 1, 'else': 1, 'on': 1, 'error': 1,
        'option': 1, 'explicit': 1, 'new': 1, 'private': 1, 'property': 1, 'let': 1, 'get': 1, 'public': 1,
        'randomize': 1, 'redim': 1, 'rem': 1, 'select': 1, 'case': 1, 'set': 1, 'stop': 1, 'sub': 1, 'while': 1,
        'wend': 1, 'with': 1, 'end': 1, 'to': 1, 'elseif': 1, 'is': 1, 'or': 1, 'xor': 1, 'and': 1, 'not': 1,
        'class_initialize': 1, 'class_terminate': 1, 'default': 1, 'preserve': 1, 'in': 1, 'me': 1, 'byval': 1,
        'byref': 1, 'step': 1, 'resume': 1, 'goto': 1
      },
      'built_in': {
        'lcase': 1, 'month': 1, 'vartype': 1, 'instrrev': 1, 'ubound': 1, 'setlocale': 1, 'getobject': 1,
        'rgb': 1, 'getref': 1, 'string': 1, 'weekdayname': 1, 'rnd': 1, 'dateadd': 1, 'monthname': 1, 'now': 1,
        'day': 1, 'minute': 1, 'isarray': 1, 'cbool': 1, 'round': 1, 'formatcurrency': 1, 'conversions': 1,
        'csng': 1, 'timevalue': 1, 'second': 1, 'year': 1, 'space': 1, 'abs': 1, 'clng': 1, 'timeserial': 1,
        'fixs': 1, 'len': 1, 'asc': 1, 'isempty': 1, 'maths': 1, 'dateserial': 1, 'atn': 1, 'timer': 1,
        'isobject': 1, 'filter': 1, 'weekday': 1, 'datevalue': 1, 'ccur': 1, 'isdate': 1, 'instr': 1, 'datediff': 1,
        'formatdatetime': 1, 'replace': 1, 'isnull': 1, 'right': 1, 'sgn': 1, 'array': 1, 'snumeric': 1, 'log': 1,
        'cdbl': 1, 'hex': 1, 'chr': 1, 'lbound': 1, 'msgbox': 1, 'ucase': 1, 'getlocale': 1, 'cos': 1, 'cdate': 1,
        'cbyte': 1, 'rtrim': 1, 'join': 1, 'hour': 1, 'oct': 1, 'typename': 1, 'trim': 1, 'strcomp': 1, 'int': 1,
        'createobject': 1, 'loadpicture': 1, 'tan': 1, 'formatnumber': 1, 'mid': 1, 'scriptenginebuildversion': 1,
        'scriptengine': 1, 'split': 1, 'scriptengineminorversion': 1, 'cint': 1, 'sin': 1, 'datepart': 1, 'ltrim': 1,
        'sqr': 1, 'scriptenginemajorversion': 1, 'time': 1, 'derived': 1, 'eval': 1, 'date': 1, 'formatpercent': 1,
        'exp': 1, 'inputbox': 1, 'left': 1, 'ascw': 1, 'chrw': 1, 'regexp': 1, 'server': 1, 'response': 1,
        'request': 1, 'cstr': 1, 'err': 1
      },
      'literal': {'true': 1, 'false': 1, 'null': 1, 'nothing': 1, 'empty': 1}
    },
    illegal: '//',
    contains: [
      { // can't use standard QUOTE_STRING_MODE since it's compiled with its own escape and doesn't use the local one
        className: 'string',
        begin: '"', end: '"',
        illegal: '\\n',
        contains: [{begin: '""'}],
        relevance: 0
      },
      {
        className: 'comment',
        begin: '\'', end: '$'
      },
      hljs.C_NUMBER_MODE
    ]
  }
};
/*
Language: VHDL
Description: VHDL is a hardware description language used in electronic design automation to describe digital and mixed-signal systems.
Author: Igor Kalnitsky <igor.kalnitsky@gmail.com>
Website: http://kalnitsky.org.ua/
*/

hljs.LANGUAGES.vhdl = {
  case_insensitive: true,
  defaultMode: {
    keywords: {
      'keyword': {
        'abs': 1, 'access': 1, 'after': 1, 'alias': 1, 'all': 1, 'and': 1, 'architecture': 2, 'array': 1, 'assert': 1,
        'attribute': 1, 'begin': 1, 'block': 1, 'body': 1, 'buffer': 1, 'bus': 1, 'case': 1, 'component': 2,
        'configuration': 1, 'constant': 1, 'disconnect': 2, 'downto': 2, 'else': 1, 'elsif': 1, 'end': 1, 'entity': 2,
        'exit': 1, 'file': 1, 'for': 1, 'function': 1, 'generate': 2, 'generic': 2, 'group': 1, 'guarded': 2, 'if': 0,
        'impure': 2, 'in': 1, 'inertial': 1, 'inout': 1, 'is': 1, 'label': 1, 'library': 1, 'linkage': 1, 'literal': 1,
        'loop': 1, 'map': 1, 'mod': 1, 'nand': 1, 'new': 1, 'next': 1, 'nor': 1, 'not': 1, 'null': 1, 'of': 1, 'on': 1,
        'open': 1, 'or': 1, 'others': 1, 'out': 1, 'package': 1, 'port': 2, 'postponed': 1, 'procedure': 1,
        'process': 1, 'pure': 2, 'range': 1, 'record': 1, 'register': 1, 'reject': 1, 'return': 1, 'rol': 1, 'ror': 1,
        'select': 1, 'severity': 1, 'signal': 1, 'shared': 1, 'sla': 1, 'sli': 1, 'sra': 1, 'srl': 1, 'subtype': 2,
        'then': 1, 'to': 1, 'transport': 1, 'type': 1, 'units': 1, 'until': 1, 'use': 1, 'variable': 1, 'wait': 1,
        'when': 1, 'while': 1, 'with': 1, 'xnor': 1, 'xor': 1
      },
      'type': {
        'boolean': 1, 'bit': 1, 'character': 1, 'severity_level': 2, 'integer': 1, 'time': 1, 'delay_length': 2,
        'natural': 1, 'positive': 1, 'string': 1, 'bit_vector': 2, 'file_open_kind': 2, 'file_open_status': 2,
        'std_ulogic': 2, 'std_ulogic_vector': 2, 'std_logic': 2, 'std_logic_vector': 2
      }
    },
    illegal: '{',
    contains: [
      {
        className: 'comment',
        begin: '--', end: '$'
      },
      hljs.QUOTE_STRING_MODE,
      hljs.C_NUMBER_MODE,
      {
        className: 'literal',
        begin: '\'(U|X|0|1|Z|W|L|H|-)', end: '\'',
        contains: [hljs.BACKSLASH_ESCAPE]
      }
    ]
  }
};
