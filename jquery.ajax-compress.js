// ==ClosureCompiler==
// @output_file_name jquery.ajax-compress.min.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// @language ECMASCRIPT3
// ==/ClosureCompiler==

/**
 * @description A plugin for jQuery to compress AJAX request bodies.
 * @version 1.0.0
 * @requires jQuery 1.5+
 * @author Aaron Papp <https://github.com/Aaron-P>
 * @license AJAX Compress; A plugin for jQuery to compress AJAX request bodies.
 * Copyright (C) 2013 Aaron Papp <https://github.com/Aaron-P>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @description Provides jQuery with a method to compress AJAX request bodies.
 * @public
 * @param {jQuery} $
 */
(function($)
{
	"use strict";//Should we use this? jQuery itself doesn't due to bugs.
	/**
	 * @private
	 * @constant
	 */
	var DEFAULT_COMPRESSION       = "gzip",
	    DEFAULT_COMPRESSION_LEVEL = 6;//Same as mod_deflate just because.

	/* Start GPLv2 Licensed Code */
	/**
	 * @private
	 * @class
	 */
	function Deflate()
	{
		/* Private Constants */
		/**
		 * @private
		 * @constant
		 */
		var WSIZE               = 0x8000,
		    STORED_BLOCK        = 0,
		    STATIC_TREES        = 1,
		    DYN_TREES           = 2,
		    DEFAULT_LEVEL       = 6,
		    FULL_SEARCH         = true,
		    INBUFSIZ            = 0x8000,
		    INBUF_EXTRA         = 64,
		    OUTBUFSIZ           = 0x2000,
		    WINDOW_SIZE         = 2 * WSIZE,
		    MIN_MATCH           = 3,
		    MAX_MATCH           = 258,
		    BITS                = 16,
		/* SMALL_MEM */
		    LIT_BUFSIZE         = 0x2000,
//		    HASH_BITS           = 13,
		/* MEDIUM_MEM */
//		    LIT_BUFSIZE         = 0x4000,
//		    HASH_BITS           = 14,
		/* BIG_MEM */
//		    LIT_BUFSIZE         = 0x8000,
		    HASH_BITS           = 15,
		    DIST_BUFSIZE        = LIT_BUFSIZE,
		    HASH_SIZE           = 1 << HASH_BITS,
		    HASH_MASK           = HASH_SIZE - 1,
		    WMASK               = WSIZE - 1,
		    NIL                 = 0,
		    TOO_FAR             = 4096,
		    MIN_LOOKAHEAD       = MAX_MATCH + MIN_MATCH + 1,
		    MAX_DIST            = WSIZE - MIN_LOOKAHEAD,
		    SMALLEST            = 1,
		    MAX_BITS            = 15,
		    MAX_BL_BITS         = 7,
		    LENGTH_CODES        = 29,
		    LITERALS            = 256,
		    END_BLOCK           = 256,
		    L_CODES             = LITERALS + 1 + LENGTH_CODES,
		    D_CODES             = 30,
		    BL_CODES            = 19,
		    REP_3_6             = 16,
		    REPZ_3_10           = 17,
		    REPZ_11_138         = 18,
		    HEAP_SIZE           = 2 * L_CODES + 1,
		    H_SHIFT             = ~~((HASH_BITS + MIN_MATCH - 1) / MIN_MATCH),
		    EXTRA_LBITS         = [ 0,  0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  2,  2,  2,  2,  3,  3,  3,  3,  4,  4,  4,  4,  5,  5,  5,  5,  0],
		    EXTRA_DBITS         = [ 0,  0,  0,  0,  1,  1,  2,  2,  3,  3,  4,  4,  5,  5,  6,  6,  7,  7,  8,  8,  9,  9, 10, 10, 11, 11, 12, 12, 13, 13],
		    EXTTRA_BLBITS       = [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  2,  3,  7],
		    BL_ORDER            = [16, 17, 18,  0,  8,  7,  9,  6, 10,  5, 11,  4, 12,  3, 13,  2, 14,  1, 15],
		    CONFIGURATION_TABLE = [
				new DeflateConfiguration(   0,    0,    0,    0),
				new DeflateConfiguration(   4,    4,    8,    4),
				new DeflateConfiguration(   4,    5,   16,    8),
				new DeflateConfiguration(   4,    6,   32,   32),
				new DeflateConfiguration(   4,    4,   16,   16),
				new DeflateConfiguration(   8,   16,   32,   32),
				new DeflateConfiguration(   8,   16,  128,  128),
				new DeflateConfiguration(   8,   32,  128,  256),
				new DeflateConfiguration(  32,  128,  258, 1024),
				new DeflateConfiguration(  32,  258,  258, 4096)
		    ];

		////////////////////////////////////////////////////////////////////////

		/* Private Variables */
		/**
		 * @private
		 */
		var free_queue,
		    qhead,
		    qtail,
		    initflag,
		    outbuf = null,//Why?
		    outcnt,
		    outoff,
		    complete,
		    window,
		    d_buf,
		    l_buf,
		    prev,
		    bi_buf,
		    bi_valid,
		    block_start,
		    ins_h,
		    hash_head,
		    prev_match,
		    match_available,
		    match_length,
		    prev_length,
		    strstart,
		    match_start,
		    eofile,
		    lookahead,
		    max_chain_length,
		    max_lazy_match,
		    compr_level,
		    good_match,
		    nice_match,
		    dyn_ltree,
		    dyn_dtree,
		    static_ltree,
		    static_dtree,
		    bl_tree,
		    l_desc,
		    d_desc,
		    bl_desc,
		    bl_count,
		    heap,
		    heap_len,
		    heap_max,
		    depth,
		    length_code,
		    dist_code,
		    base_length,
		    base_dist,
		    flag_buf,
		    last_lit,
		    last_dist,
		    last_flags,
		    flags,
		    flag_bit,
		    opt_len,
		    static_len,
		    deflate_data,
		    deflate_pos;

		////////////////////////////////////////////////////////////////////////

		/* Private Classes */
		/**
		 * @private
		 * @class
		 * @struct
		 */
		function DeflateCT()
		{
			this.fc = 0;//Frequency count or bit string
			this.dl = 0;//Father node in Huffman tree or length of bit string
		}

		/**
		 * @private
		 * @class
		 * @struct
		 */
		function DeflateTreeDesc()
		{
			this.dyn_tree    = null;//The dynamic tree
			this.static_tree = null;//Corresponding static tree or NULL
			this.extra_bits  = null;//Extra bits for each code or NULL
			this.extra_base  = 0;//Base index for extra_bits
			this.elems       = 0;//Max number of elements in the tree
			this.max_length  = 0;//Max bit length for the codes
			this.max_code    = 0;//Largest code with non zero frequency
		}

		/**
		 * @private
		 * @class
		 * @struct
		 * @param {Number} good_length
		 * @param {Number} max_lazy
		 * @param {Number} nice_length
		 * @param {Number} max_chain
		 */
		function DeflateConfiguration(good_length, max_lazy, nice_length, max_chain)
		{
			/*
			 * Values for max_lazy_match, good_match and max_chain_length, depending on
			 * the desired pack level (0..9). The values given below have been tuned to
			 * exclude worst case performance for pathological files. Better values may be
			 * found for specific files.
			 */
			this.good_length = good_length;//Reduce lazy search above this match length
			this.max_lazy    = max_lazy;//Do not perform lazy search above this match length
			this.nice_length = nice_length;//Quit search above this match length
			this.max_chain   = max_chain;
		}

		/**
		 * @private
		 * @class
		 * @struct
		 */
		function DeflateBuffer()
		{
			this.next = null;
			this.len  = 0;
			this.ptr  = [];//new Array(OUTBUFSIZ); .length never called.
			this.off  = 0;
		}

		////////////////////////////////////////////////////////////////////////////

		/* Private Methods */
		/**
		 * @private
		 * @param {Number} level
		 * @throws {Error}
		 */
		function deflate_start(level)
		{
			var i;

			if (!level)
				level = DEFAULT_LEVEL;
			else if (level < 1)
				level = 1;
			else if (level > 9)
				level = 9;

			compr_level = level;
			initflag    = false;
			eofile      = false;
			if (outbuf !== null)
				throw new Error("Deflate output buffer not null.");//return; Should this an exception? Why is this check even here?

			free_queue = null;
			qhead      = null;
			qtail      = null;
			outbuf     = [];//new Array(OUTBUFSIZ); .length never called.
			window     = [];//new Array(WINDOW_SIZE); .length never called.
			d_buf      = [];//new Array(DIST_BUFSIZE); .length never called
			l_buf      = [];//new Array(INBUFSIZ + INBUF_EXTRA); .length never called.
			prev       = [];//new Array(1 << BITS); .length never called.

			dyn_ltree    = [];//new Array(HEAP_SIZE); .length never called.
			for (i = 0; i < HEAP_SIZE; i++)
				dyn_ltree[i]    = new DeflateCT();

			dyn_dtree    = [];//new Array(2 * D_CODES + 1); .length never called.
			for (i = 0; i < 2 * D_CODES + 1; i++)
				dyn_dtree[i]    = new DeflateCT();

			static_ltree = [];//new Array(L_CODES + 2); .length never called.
			for (i = 0; i < L_CODES + 2; i++)
				static_ltree[i] = new DeflateCT();

			static_dtree = [];//new Array(D_CODES); .length never called.
			for (i = 0; i < D_CODES; i++)
				static_dtree[i] = new DeflateCT();

			bl_tree      = [];//new Array(2 * BL_CODES + 1); .length never called.
			for (i = 0; i < 2 * BL_CODES + 1; i++)
				bl_tree[i]      = new DeflateCT();

			l_desc      = new DeflateTreeDesc();
			d_desc      = new DeflateTreeDesc();
			bl_desc     = new DeflateTreeDesc();
			bl_count    = [];//new Array(MAX_BITS + 1); .length never called.
			heap        = [];//new Array(2 * L_CODES + 1); .length never called.
			depth       = [];//new Array(2 * L_CODES + 1); .length never called.
			length_code = [];//new Array(MAX_MATCH - MIN_MATCH + 1); .length never called.
			dist_code   = [];//new Array(512); .length never called.
			base_length = [];//new Array(LENGTH_CODES); .length never called.
			base_dist   = [];//new Array(D_CODES); .length never called.
			flag_buf    = [];//new Array(parseInt(LIT_BUFSIZE / 8, 10)); .length never called.
		}

		/**
		 * @private
		 */
		function deflate_end()
		{
			free_queue   = null;
			qhead        = null;
			qtail        = null;
			outbuf       = null;
			window       = null;
			d_buf        = null;
			l_buf        = null;
			prev         = null;
			dyn_ltree    = null;
			dyn_dtree    = null;
			static_ltree = null;
			static_dtree = null;
			bl_tree      = null;
			l_desc       = null;
			d_desc       = null;
			bl_desc      = null;
			bl_count     = null;
			heap         = null;
			depth        = null;
			length_code  = null;
			dist_code    = null;
			base_length  = null;
			base_dist    = null;
			flag_buf     = null;
		}

//		/**
//		 * @private
//		 * @param {?} p
//		 * ? = _L24.Deflate.DeflateBuffer
//		 * How do we declare a custom type?
//		 */
//		function reuse_queue(p)
//		{
//			p.next     = free_queue;
//			free_queue = p;
//		}

		/**
		 * @private
		 * @returns {?}
		 * ? = _L24.Deflate.DeflateBuffer
		 * How do we declare a custom type?
		 */
		function new_queue()
		{
			var p;

			if (free_queue !== null)
			{
				p = free_queue;
				free_queue = free_queue.next;
			}
			else
				p = new DeflateBuffer();
			p.next = null;
			p.len  = p.off = 0;

			return p;
		}

//		/**
//		 * @private
//		 * @param {Number} i
//		 * @returns {Number}
//		 */
//		function head1(i)
//		{
//			return prev[WSIZE + i];
//		}

//		/**
//		 * @private
//		 * @param {Number} i
//		 * @param {Number} val
//		 * @returns {Number}
//		 */
//		function head2(i, val)
//		{
//			return prev[WSIZE + i] = val;
//		}

//		/**
//		 * @private
//		 * @param {Number} i
//		 * @param {Number} val
//		 */
//		function update_hash(i, val)
//		{
//			i = ((i << H_SHIFT) ^ (val & 0xFF)) & HASH_MASK;
//		}

		/**
		 * @private
		 * @param {Number} c
		 */
		function put_byte(c)
		{
			/*
			 * put_byte is used for the compressed output, put_ubyte for the
			 * uncompressed output. However unlzw() uses window for its
			 * suffix table instead of its output buffer, so it does not use put_ubyte
			 * (to be cleaned up).
			 */
			outbuf[outoff + outcnt++] = c;
			if (outoff + outcnt === OUTBUFSIZ)
				qoutbuf();
		}

		/**
		 * @private
		 * @param {Number} w
		 */
		function put_short(w)
		{
			//Output a 16 bit value, lsb first
			w &= 0xFFFF;
			if (outoff + outcnt < OUTBUFSIZ - 2)
			{
				outbuf[outoff + outcnt++] = (w & 0xFF);
				outbuf[outoff + outcnt++] = (w >>> 8);
			}
			else
			{
				put_byte(w & 0xFF);
				put_byte(w >>> 8);
			}
		}

//		/**
//		 * @private
//		 */
//		function insert_string()
//		{
//			/*
//			 * Insert string s in the dictionary and set match_head to the previous head
//			 * of the hash chain (the most recent string with same hash key). Return
//			 * the previous length of the hash chain.
//			 * IN  assertion: all calls to to insert_string are made with consecutive
//			 *    input characters and the first MIN_MATCH bytes of s are valid
//			 *    (except for the last MIN_MATCH-1 bytes of the input file).
//			 */
//			//update_hash(ins_h, window[strstart + MIN_MATCH - 1]);
//			ins_h = ((ins_h << H_SHIFT) ^ (window[strstart + MIN_MATCH - 1] & 0xFF)) & HASH_MASK;
//			//hash_head = head1(ins_h);
//			hash_head = prev[WSIZE + ins_h];
//			prev[strstart & WMASK] = hash_head;
//			//head2(ins_h, strstart);
//			prev[WSIZE + ins_h] = strstart;
//		}

//		/**
//		 * @private
//		 * @param {Number} c
//		 * @param {?} tree
//		 * ? = _L24.Deflate.DeflateCT
//		 * How do we declare a custom type?
//		 */
//		function send_code(c, tree)
//		{
//			//Send a code of the given tree. c and tree must not have side effects
//			send_bits(tree[c].fc, tree[c].dl);
//		}

		/**
		 * @private
		 * @param {Number} dist
		 * @returns {Number}
		 */
		function d_code(dist)
		{
			/*
			 * Mapping from a distance to a distance code. dist is the distance - 1 and
			 * must not have side effects. dist_code[256] and dist_code[257] are never
			 * used.
			 */
			return (dist < 256 ? dist_code[dist] : dist_code[256 + (dist >> 7)]) & 0xFF;
		}

		/**
		 * @private
		 * @param {?} tree
		 * @param {Number} n
		 * @param {Number} m
		 * @returns {Boolean}
		 * ? = _L24.Deflate.DeflateCT
		 * How do we declare a custom type?
		 */
		function smaller(tree, n, m)
		{
			/*
			 * Compares to subtrees, using the tree depth as tie breaker when
			 * the subtrees have equal frequency. This minimizes the worst case length.
			 */
			return tree[n].fc < tree[m].fc || (tree[n].fc === tree[m].fc && depth[n] <= depth[m]);
		}

		/**
		 * @private
		 * @param {Array} buff
		 * @param {Number} offset
		 * @param {Number} n
		 * @returns {?number}
		 */
		function read_buff(buff, offset, n)
		{
			//Read string data
			var i;
			for (i = 0; i < n && deflate_pos < deflate_data.length; i++)
				buff[offset + i] = deflate_data.charCodeAt(deflate_pos++) & 0xFF;
			return i;
		}

		/**
		 * @private
		 * @returns {undefined}
		 */
		function lm_init()
		{
			//Initialize the "longest match" routines for a new file
			var j;

			//Initialize the hash table.
			for (j = 0; j < HASH_SIZE; j++)
				//head2(j, NIL);
				prev[WSIZE + j] = NIL;
			//prev will be initialized on the fly

			//Set the default configuration parameters
			max_lazy_match = CONFIGURATION_TABLE[compr_level].max_lazy;
			good_match = CONFIGURATION_TABLE[compr_level].good_length;
			if (!FULL_SEARCH)
				nice_match = CONFIGURATION_TABLE[compr_level].nice_length;
			max_chain_length = CONFIGURATION_TABLE[compr_level].max_chain;

			strstart    = 0;
			block_start = 0;

			lookahead = read_buff(window, 0, 2 * WSIZE);
			if (lookahead <= 0)
			{
				eofile = true;
				lookahead = 0;
				return;
			}
			eofile = false;
			/*
			 * Make sure that we always have enough lookahead. This is important
			 * if input comes from a device such as a tty.
			 */
			while (lookahead < MIN_LOOKAHEAD && !eofile)
				fill_window();

			/*
			 * If lookahead < MIN_MATCH, ins_h is garbage, but this is
			 * not important since only literal bytes will be emitted.
			 */
			ins_h = 0;
			for (j = 0; j < MIN_MATCH - 1; j++)
				//update_hash(ins_h, window[j]);
				ins_h = ((ins_h << H_SHIFT) ^ (window[j] & 0xFF)) & HASH_MASK;
		}

		/**
		 * @private
		 * @param {Number} cur_match
		 * @returns {Number}
		 */
		function longest_match(cur_match)
		{
			/*
			 * Set match_start to the longest match starting at the given string and
			 * return its length. Matches shorter or equal to prev_length are discarded,
			 * in which case the result is equal to prev_length and match_start is
			 * garbage.
			 * IN assertions: cur_match is the head of the hash chain for the current
			 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
			 */
			var chain_length = max_chain_length,//Max hash chain length
			    scanp        = strstart,//Current string
			    best_len     = prev_length,//Best match length so far
			    matchp,//Matched string
			    len,//Length of current match
			/*
			 * Stop when cur_match becomes <= limit. To simplify the code,
			 * we prevent matches with the string of window index 0.
			 */
			    limit     = (strstart > MAX_DIST ? strstart - MAX_DIST : NIL),
			    strendp   = strstart + MAX_MATCH,
			    scan_end1 = window[scanp + best_len - 1],
			    scan_end  = window[scanp + best_len],
			    i, broke;

			//Do not waste too much time if we already have a good match
			if (prev_length >= good_match)
				chain_length >>= 2;

			do
			{
				matchp = cur_match;

				/*
				 * Skip to next match if the match length cannot increase
				 * or if the match length is less than 2:
				 */
				if (window[matchp + best_len] !== scan_end ||
					window[matchp + best_len - 1] !== scan_end1 ||
					window[matchp] !== window[scanp] ||
					window[++matchp] !== window[scanp + 1])
					continue;

				/*
				 * The check at best_len-1 can be removed because it will be made
				 * again later. (This heuristic is not always a win.)
				 * It is not necessary to compare scan[2] and match[2] since they
				 * are always equal when the other bytes match, given that
				 * the hash keys are equal and that HASH_BITS >= 8.
				 */
				scanp += 2;
				matchp++;

				/*
				 * We check for insufficient lookahead only every 8th comparison;
				 * the 256th check will be made at strstart+258.
				 */
				/*do {} while (window[++scanp] === window[++matchp] &&
					window[++scanp] === window[++matchp] &&
					window[++scanp] === window[++matchp] &&
					window[++scanp] === window[++matchp] &&
					window[++scanp] === window[++matchp] &&
					window[++scanp] === window[++matchp] &&
					window[++scanp] === window[++matchp] &&
					window[++scanp] === window[++matchp] &&
					scanp < strendp);*/
				while (scanp < strendp)
				{
					broke = false;
					for (i = 0; i < 8; i += 1)
					{
						scanp += 1;
						matchp += 1;
						if (window[scanp] !== window[matchp])
						{
							broke = true;
							break;
						}
					}

					if (broke)
						break;
				}

				len = MAX_MATCH - (strendp - scanp);
				scanp = strendp - MAX_MATCH;

				if (len > best_len)
				{
					match_start = cur_match;
					best_len = len;
					if (FULL_SEARCH)
					{
						if (len >= MAX_MATCH)
							break;
					}
					else
					{
						if (len >= nice_match)
							break;
					}

					scan_end1 = window[scanp + best_len - 1];
					scan_end = window[scanp + best_len];
				}
			}
			while ((cur_match = prev[cur_match & WMASK]) > limit && --chain_length !== 0);

			return best_len;
		}

		/**
		 * @private
		 */
		function fill_window()
		{
			/*
			 * Fill the window when the lookahead becomes insufficient.
			 * Updates strstart and lookahead, and sets eofile if end of input file.
			 * IN assertion: lookahead < MIN_LOOKAHEAD && strstart + lookahead > 0
			 * OUT assertions: at least one byte has been read, or eofile is set;
			 *    file reads are performed for at least two bytes (required for the
			 *    translate_eol option).
			 */
			var n, m,
			//Amount of free space at the end of the window.
			    more = WINDOW_SIZE - lookahead - strstart;

			/*
			 * If the window is almost full and there is insufficient lookahead,
			 * move the upper half to the lower one to make room in the upper half.
			 */
			if (more === -1)
				/*
				 * Very unlikely, but possible on 16 bit machine if strstart === 0
				 * and lookahead === 1 (input done one byte at time)
				 */
				more--;
			else if (strstart >= WSIZE + MAX_DIST)
			{
				/*
				 * By the IN assertion, the window is not empty so we can't confuse
				 * more === 0 with more === 64K on a 16 bit machine.
				 */
				for (n = 0; n < WSIZE; n++)
					window[n] = window[n + WSIZE];

				match_start -= WSIZE;
				strstart    -= WSIZE;//We now have strstart >= MAX_DIST
				block_start -= WSIZE;

				for (n = 0; n < HASH_SIZE; n++)
				{
					//m = head1(n);
					m = prev[WSIZE + n];
					//head2(n, m >= WSIZE ? m - WSIZE : NIL);
					prev[WSIZE + n] = m >= WSIZE ? m - WSIZE : NIL;
				}
				for (n = 0; n < WSIZE; n++)
				{
					/*
					 * If n is not on any hash chain, prev[n] is garbage but
					 * its value will never be used.
					 */
					m = prev[n];
					prev[n] = (m >= WSIZE ? m - WSIZE : NIL);
				}
				more += WSIZE;
			}
			//At this point, more >= 2
			if (!eofile)
			{
				n = read_buff(window, strstart + lookahead, more);
				if (n <= 0)
					eofile = true;
				else
					lookahead += n;
			}
		}

		/**
		 * @private
		 */
		function deflate_fast()
		{
			/*
			 * Processes a new input file and return its compressed length. This
			 * function does not perform lazy evaluationof matches and inserts
			 * new strings in the dictionary only for unmatched strings or for short
			 * matches. It is used only for the fast compression options.
			 */
			while (lookahead !== 0 && qhead === null)
			{
				var flush;//Set if current block must be flushed

				/*
				 * Insert the string window[strstart .. strstart+2] in the
				 * dictionary, and set hash_head to the head of the hash chain:
				 */
				//insert_string();
				ins_h = ((ins_h << H_SHIFT) ^ (window[strstart + MIN_MATCH - 1] & 0xFF)) & HASH_MASK;
				//hash_head = head1(ins_h);
				hash_head = prev[WSIZE + ins_h];
				prev[strstart & WMASK] = hash_head;
				//head2(ins_h, strstart);
				prev[WSIZE + ins_h] = strstart;

				/*
				 * Find the longest match, discarding those <= prev_length.
				 * At this point we have always match_length < MIN_MATCH
				 */
				if (hash_head !== NIL && strstart - hash_head <= MAX_DIST)
				{
					/*
					 * To simplify the code, we prevent matches with the string
					 * of window index 0 (in particular we have to avoid a match
					 * of the string with itself at the start of the input file).
					 */
					match_length = longest_match(hash_head);
					//longest_match() sets match_start
					if (match_length > lookahead)
						match_length = lookahead;
				}
				if (match_length >= MIN_MATCH)
				{
					flush = ct_tally(strstart - match_start, match_length - MIN_MATCH);
					lookahead -= match_length;

					/*
					 * Insert new strings in the hash table only if the match length
					 * is not too large. This saves time but degrades compression.
					 */
					if (match_length <= max_lazy_match)
					{
						match_length--;//String at strstart already in hash table
						do
						{
							strstart++;
							//insert_string();
							ins_h = ((ins_h << H_SHIFT) ^ (window[strstart + MIN_MATCH - 1] & 0xFF)) & HASH_MASK;
							//hash_head = head1(ins_h);
							hash_head = prev[WSIZE + ins_h];
							prev[strstart & WMASK] = hash_head;
							//head2(ins_h, strstart);
							prev[WSIZE + ins_h] = strstart;
							/*
							 * strstart never exceeds WSIZE-MAX_MATCH, so there are
							 * always MIN_MATCH bytes ahead. If lookahead < MIN_MATCH
							 * these bytes are garbage, but it does not matter since
							 * the next lookahead bytes will be emitted as literals.
							 */
						}
						while (--match_length !== 0);
						strstart++;
					}
					else
					{
						strstart += match_length;
						match_length = 0;
						ins_h = window[strstart] & 0xFF;
						//update_hash(ins_h, window[strstart + 1]);
						ins_h = ((ins_h << H_SHIFT) ^ (window[strstart + 1] & 0xFF)) & HASH_MASK;

						//#if MIN_MATCH !== 3
						//		Call update_hash() MIN_MATCH-3 more times
						//#endif
					}
				}
				else
				{
					//No match, output a literal byte
					flush = ct_tally(0, window[strstart] & 0xFF);
					lookahead--;
					strstart++;
				}
				if (flush)
				{
					flush_block(0);
					block_start = strstart;
				}

				/*
				 * Make sure that we always have enough lookahead, except
				 * at the end of the input file. We need MAX_MATCH bytes
				 * for the next match, plus MIN_MATCH bytes to insert the
				 * string following the next match.
				 */
				while (lookahead < MIN_LOOKAHEAD && !eofile)
					fill_window();
			}
		}

		/**
		 * @private
		 */
		function deflate_better()
		{
			//Process the input block.
			while (lookahead !== 0 && qhead === null)
			{
				/*
				 * Insert the string window[strstart .. strstart+2] in the
				 * dictionary, and set hash_head to the head of the hash chain:
				 */
				//insert_string();
				ins_h = ((ins_h << H_SHIFT) ^ (window[strstart + MIN_MATCH - 1] & 0xFF)) & HASH_MASK;
				//hash_head = head1(ins_h);
				hash_head = prev[WSIZE + ins_h];
				prev[strstart & WMASK] = hash_head;
				//head2(ins_h, strstart);
				prev[WSIZE + ins_h] = strstart;

				//Find the longest match, discarding those <= prev_length.
				prev_length  = match_length;
				prev_match   = match_start;
				match_length = MIN_MATCH - 1;

				if (hash_head !== NIL && prev_length < max_lazy_match && strstart - hash_head <= MAX_DIST)
				{
					/*
					 * To simplify the code, we prevent matches with the string
					 * of window index 0 (in particular we have to avoid a match
					 * of the string with itself at the start of the input file).
					 */
					match_length = longest_match(hash_head);
					//longest_match() sets match_start
					if (match_length > lookahead)
						match_length = lookahead;

					//Ignore a length 3 match if it is too distant
					if (match_length === MIN_MATCH && strstart - match_start > TOO_FAR)
						/*
						 * If prev_match is also MIN_MATCH, match_start is garbage
						 * but we will ignore the current match anyway.
						 */
						match_length--;
				}
				/*
				 * If there was a match at the previous step and the current
				 * match is not better, output the previous match:
				 */
				if (prev_length >= MIN_MATCH && match_length <= prev_length)
				{
					//Set if current block must be flushed
					var flush = ct_tally(strstart - 1 - prev_match, prev_length - MIN_MATCH);

					/*
					 * Insert in hash table all strings up to the end of the match.
					 * strstart-1 and strstart are already inserted.
					 */
					lookahead -= prev_length - 1;
					prev_length -= 2;
					do
					{
						strstart++;
						//insert_string();
						ins_h = ((ins_h << H_SHIFT) ^ (window[strstart + MIN_MATCH - 1] & 0xFF)) & HASH_MASK;
						//hash_head = head1(ins_h);
						hash_head = prev[WSIZE + ins_h];
						prev[strstart & WMASK] = hash_head;
						//head2(ins_h, strstart);
						prev[WSIZE + ins_h] = strstart;
						/*
						 * strstart never exceeds WSIZE-MAX_MATCH, so there are
						 * always MIN_MATCH bytes ahead. If lookahead < MIN_MATCH
						 * these bytes are garbage, but it does not matter since the
						 * next lookahead bytes will always be emitted as literals.
						 */
					}
					while (--prev_length !== 0);
					match_available = false;
					match_length = MIN_MATCH - 1;
					strstart++;
					if (flush)
					{
						flush_block(0);
						block_start = strstart;
					}
				}
				else if (match_available)
				{
					/*
					 * If there was no match at the previous position, output a
					 * single literal. If there was a match but the current match
					 * is longer, truncate the previous match to a single literal.
					 */
					if (ct_tally(0, window[strstart - 1] & 0xFF))
					{
						flush_block(0);
						block_start = strstart;
					}
					strstart++;
					lookahead--;
				}
				else
				{
					/*
					 * There is no previous match to compare with, wait for
					 * the next step to decide.
					 */
					match_available = true;
					strstart++;
					lookahead--;
				}

				/*
				 * Make sure that we always have enough lookahead, except
				 * at the end of the input file. We need MAX_MATCH bytes
				 * for the next match, plus MIN_MATCH bytes to insert the
				 * string following the next match.
				 */
				while (lookahead < MIN_LOOKAHEAD && !eofile)
					fill_window();
			}
		}

		/**
		 * @private
		 * @returns {undefined}
		 */
		function init_deflate()
		{
			if (eofile)
				return;
			bi_buf   = 0;
			bi_valid = 0;
			ct_init();
			lm_init();

			qhead  = null;
			outcnt = 0;
			outoff = 0;

			if (compr_level <= 3)
			{
				prev_length = MIN_MATCH - 1;
				match_length = 0;
			}
			else
			{
				match_length = MIN_MATCH - 1;
				match_available = false;
			}

			complete = false;
		}

		/**
		 * @private
		 * @param {Array} buff
		 * @param {Number} off
		 * @param {Number} buff_size
		 * @returns {Number}
		 */
		function deflate_internal(buff, off, buff_size)
		{
			/*
			 * Same as above, but achieves better compression. We use a lazy
			 * evaluation for matches: a match is finally adopted only if there is
			 * no better match at the next window position.
			 */
			var n;

			if (!initflag)
			{
				init_deflate();
				initflag = true;
				if (lookahead === 0)
				{//Empty
					complete = true;
					return 0;
				}
			}

			if ((n = qcopy(buff, off, buff_size)) === buff_size)
				return buff_size;

			if (complete)
				return n;

			if (compr_level <= 3)//Optimized for speed
				deflate_fast();
			else
				deflate_better();
			if (lookahead === 0)
			{
				if (match_available)
					ct_tally(0, window[strstart - 1] & 0xFF);
				flush_block(1);
				complete = true;
			}

			return n + qcopy(buff, n + off, buff_size - n);
		}

		/**
		 * @private
		 * @param {Array} buff
		 * @param {Number} off
		 * @param {Number} buff_size
		 * @returns {Number}
		 */
		function qcopy(buff, off, buff_size)
		{
			var n = 0, i, j;

			while (qhead !== null && n < buff_size)
			{
				i = buff_size - n;
				if (i > qhead.len)
					i = qhead.len;
				for (j = 0; j < i; j++)
					buff[off + n + j] = qhead.ptr[qhead.off + j];

				qhead.off += i;
				qhead.len -= i;
				n += i;
				if (qhead.len === 0)
				{
					var p = qhead;
					qhead = qhead.next;
					//reuse_queue(p);
					p.next     = free_queue;
					free_queue = p;
				}
			}

			if (n === buff_size)
				return n;

			if (outoff < outcnt)
			{
				i = buff_size - n;
				if (i > outcnt - outoff)
					i = outcnt - outoff;
				for (j = 0; j < i; j++)
					buff[off + n + j] = outbuf[outoff + j];
				outoff += i;
				n += i;
				if (outcnt === outoff)
					outcnt = outoff = 0;
			}
			return n;
		}

		/**
		 * @private
		 * @returns {undefined}
		 */
		function ct_init()
		{
			/*
			 * Allocate the match buffer, initialize the various tables and save the
			 * location of the internal file attribute (ascii/binary) and method
			 * (DEFLATE/STORE).
			 */
			var n,//Iterates over tree elements
			    bits,//Bit counter
			    length,//Length value
			    code,//Code value
			    dist;//Distance index

			if (static_dtree[0].dl !== 0)
				return;//ct_init already called

			l_desc.dyn_tree    = dyn_ltree;
			l_desc.static_tree = static_ltree;
			l_desc.extra_bits  = EXTRA_LBITS;
			l_desc.extra_base  = LITERALS + 1;
			l_desc.elems       = L_CODES;
			l_desc.max_length  = MAX_BITS;
			l_desc.max_code    = 0;

			d_desc.dyn_tree    = dyn_dtree;
			d_desc.static_tree = static_dtree;
			d_desc.extra_bits  = EXTRA_DBITS;
			d_desc.extra_base  = 0;
			d_desc.elems       = D_CODES;
			d_desc.max_length  = MAX_BITS;
			d_desc.max_code    = 0;

			bl_desc.dyn_tree    = bl_tree;
			bl_desc.static_tree = null;
			bl_desc.extra_bits  = EXTTRA_BLBITS;
			bl_desc.extra_base  = 0;
			bl_desc.elems       = BL_CODES;
			bl_desc.max_length  = MAX_BL_BITS;
			bl_desc.max_code    = 0;

			//Initialize the mapping length (0..255) -> length code (0..28)
			length = 0;
			for (code = 0; code < LENGTH_CODES - 1; code++)
			{
				base_length[code] = length;
				for (n = 0; n < (1 << EXTRA_LBITS[code]); n++)
					length_code[length++] = code;
			}

			/*
			 * Note that the length 255 (match length 258) can be represented
			 * in two different ways: code 284 + 5 bits or code 285, so we
			 * overwrite length_code[255] to use the best encoding:
			 */
			length_code[length - 1] = code;

			//Initialize the mapping dist (0..32K) -> dist code (0..29)
			dist = 0;
			for (code = 0; code < 16; code++)
			{
				base_dist[code] = dist;
				for (n = 0; n < (1 << EXTRA_DBITS[code]); n++)
					dist_code[dist++] = code;
			}
			//From now on, all distances are divided by 128
			for (dist >>= 7; code < D_CODES; code++)
			{
				base_dist[code] = dist << 7;
				for (n = 0; n < (1 << (EXTRA_DBITS[code] - 7)); n++)
					dist_code[256 + dist++] = code;
			}

			//Construct the codes of the static literal tree
			for (bits = 0; bits <= MAX_BITS; bits++)
				bl_count[bits] = 0;
			n = 0;
			while (n <= 143)
			{
				static_ltree[n++].dl = 8;
				bl_count[8]++;
			}
			while (n <= 255)
			{
				static_ltree[n++].dl = 9;
				bl_count[9]++;
			}
			while (n <= 279)
			{
				static_ltree[n++].dl = 7;
				bl_count[7]++;
			}
			while (n <= 287)
			{
				static_ltree[n++].dl = 8;
				bl_count[8]++;
			}
			/*
			 * Codes 286 and 287 do not exist, but we must include them in the
			 * tree construction to get a canonical Huffman tree (longest code
			 * all ones)
			 */
			gen_codes(static_ltree, L_CODES + 1);

			//The static distance tree is trivial
			for (n = 0; n < D_CODES; n++)
			{
				static_dtree[n].dl = 5;
				static_dtree[n].fc = bi_reverse(n, 5);
			}

			//Initialize the first block of the first file
			init_block();
		}

		/**
		 * @private
		 */
		function init_block()
		{
			//Initialize a new block.
			var n;//Iterates over tree elements

			//Initialize the trees.
			for (n = 0; n < L_CODES; n++)
				dyn_ltree[n].fc = 0;
			for (n = 0; n < D_CODES; n++)
				dyn_dtree[n].fc = 0;
			for (n = 0; n < BL_CODES; n++)
				bl_tree[n].fc = 0;

			dyn_ltree[END_BLOCK].fc = 1;
			opt_len = static_len = 0;
			last_lit = last_dist = last_flags = 0;
			flags = 0;
			flag_bit = 1;
		}

		/**
		 * @private
		 * @param {Array} tree
		 * @param {Number} k
		 */
		function pqdownheap(tree, k)
		{
			/*
			 * Restore the heap property by moving down the tree starting at node k,
			 * exchanging a node with the smallest of its two sons if necessary, stopping
			 * when the heap property is re-established (each father smaller than its
			 * two sons).
			 *
			 * @param tree- tree to restore
			 * @param k- node to move down
			 */
			var v = heap[k],
			    j = k << 1;//Left son of k

			while (j <= heap_len)
			{
				//Set j to the smallest of the two sons:
				if (j < heap_len && smaller(tree, heap[j + 1], heap[j]))
					j++;

				//Exit if v is smaller than both sons
				if (smaller(tree, v, heap[j]))
					break;

				//Exchange v with the smallest son
				heap[k] = heap[j];
				k = j;

				//And continue down the tree, setting j to the left son of k
				j <<= 1;
			}
			heap[k] = v;
		}

		/**
		 * @private
		 * @param {?} desc
		 * @returns {unresolved}
		 * ? = _L24.Deflate.DeflateTreeDesc
		 * How do we declare a custom type?
		 */
		function gen_bitlen(desc)
		{//The tree descriptor
			/*
			 * Compute the optimal bit lengths for a tree and update the total bit length
			 * for the current block.
			 * IN assertion: the fields freq and dad are set, heap[heap_max] and
			 *    above are the tree nodes sorted by increasing frequency.
			 * OUT assertions: the field len is set to the optimal bit length, the
			 *     array bl_count contains the frequencies for each bit length.
			 *     The length opt_len is updated; static_len is also updated if stree is
			 *     not null.
			 */
			var tree       = desc.dyn_tree,
			    extra      = desc.extra_bits,
			    base       = desc.extra_base,
			    max_code   = desc.max_code,
			    max_length = desc.max_length,
			    stree      = desc.static_tree,
			    overflow   = 0,//Number of elements with bit length too large
			    h,//Heap index
			    n, m,//Iterate over the tree elements
			    bits,//Bit length
			    xbits,//Extra bits
			    f;//Frequency

			for (bits = 0; bits <= MAX_BITS; bits++)
				bl_count[bits] = 0;

			/*
			 * In a first pass, compute the optimal bit lengths (which may
			 * overflow in the case of the bit length tree).
			 */
			tree[heap[heap_max]].dl = 0;//Root of the heap

			for (h = heap_max + 1; h < HEAP_SIZE; h++)
			{
				n = heap[h];
				bits = tree[tree[n].dl].dl + 1;
				if (bits > max_length)
				{
					bits = max_length;
					overflow++;
				}
				tree[n].dl = bits;
				//We overwrite tree[n].dl which is no longer needed

				if (n > max_code)
					continue;//Not a leaf node

				bl_count[bits]++;
				xbits = 0;
				if (n >= base)
					xbits = extra[n - base];
				f = tree[n].fc;
				opt_len += f * (bits + xbits);
				if (stree !== null)
					static_len += f * (stree[n].dl + xbits);
			}
			if (overflow === 0)
				return;

			//This happens for example on obj2 and pic of the Calgary corpus

			//Find the first bit length which could increase
			do
			{
				bits = max_length - 1;
				while (bl_count[bits] === 0)
					bits--;
				bl_count[bits]--;//Move one leaf down the tree
				bl_count[bits + 1] += 2;//Move one overflow item as its brother
				bl_count[max_length]--;
				/*
				 * The brother of the overflow item also moves one step up,
				 * but this does not affect bl_count[max_length]
				 */
				overflow -= 2;
			}
			while (overflow > 0);

			/*
			 * Now recompute all bit lengths, scanning in increasing frequency.
			 * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
			 * lengths instead of fixing only the wrong ones. This idea is taken
			 * from 'ar' written by Haruhiko Okumura.)
			 */
			for (bits = max_length; bits !== 0; bits--)
			{
				n = bl_count[bits];
				while (n !== 0)
				{
					m = heap[--h];
					if (m > max_code)
						continue;
					if (tree[m].dl !== bits)
					{
						opt_len += (bits - tree[m].dl) * tree[m].fc;
						tree[m].fc = bits;
					}
					n--;
				}
			}
		}

		/**
		 * @private
		 * @param {?} tree
		 * @param {Number} max_code
		 * ? = _L24.Deflate.DeflateCT
		 * How do we declare a custom type?
		 */
		function gen_codes(tree, max_code)
		{
			/*
			 * Generate the codes for a given tree and bit counts (which need not be
			 * optimal).
			 * IN assertion: the array bl_count contains the bit length statistics for
			 * the given tree and the field len is set for all tree elements.
			 * OUT assertion: the field code is set for all tree elements of non
			 *     zero code length.
			 * @param tree- the tree to decorate
			 * @param max_code- largest code with non-zero frequency
			 */
			var next_code = [],//Next code value for each bit length. new Array(MAX_BITS + 1); .length never called
			    code      = 0,//Running code value
			    bits,//Bit index
			    n;//Code index

			/*
			 * The distribution counts are first used to generate the code values
			 * without bit reversal.
			 */
			for (bits = 1; bits <= MAX_BITS; bits++)
			{
				code = ((code + bl_count[bits - 1]) << 1);
				next_code[bits] = code;
			}

			/*
			 * Check that the bit counts in bl_count are consistent. The last code
			 * must be all ones.
			 */
			for (n = 0; n <= max_code; n++)
			{
				var len = tree[n].dl;
				if (len === 0)
					continue;
				//Now reverse the bits
				tree[n].fc = bi_reverse(next_code[len]++, len);
			}
		}

		/**
		 * @private
		 * @param {?} desc
		 * ? = _L24.Deflate.DeflateTreeDesc
		 * How do we declare a custom type?
		 */
		function build_tree(desc)
		{//The tree descriptor
			/*
			 * Construct one Huffman tree and assigns the code bit strings and lengths.
			 * Update the total bit length for the current block.
			 * IN assertion: the field freq is set for all tree elements.
			 * OUT assertions: the fields len and code are set to the optimal bit length
			 *     and corresponding code. The length opt_len is updated; static_len is
			 *     also updated if stree is not null. The field max_code is set.
			 */
			var tree = desc.dyn_tree,
			    stree = desc.static_tree,
			    elems = desc.elems,
			    n, m,//Iterate over heap elements
			    max_code = -1,//Largest code with non zero frequency
			    node = elems;//Next internal node of the tree

			/*
			 * Construct the initial heap, with least frequent element in
			 * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
			 * heap[0] is not used.
			 */
			heap_len = 0;
			heap_max = HEAP_SIZE;

			for (n = 0; n < elems; n++)
			{
				if (tree[n].fc !== 0)
				{
					heap[++heap_len] = max_code = n;
					depth[n] = 0;
				}
				else
					tree[n].dl = 0;
			}

			/*
			 * The pkzip format requires that at least one distance code exists,
			 * and that at least one bit should be sent even if there is only one
			 * possible code. So to avoid special checks later on we force at least
			 * two codes of non zero frequency.
			 */
			while (heap_len < 2)
			{
				var xnew = heap[++heap_len] = (max_code < 2 ? ++max_code : 0);
				tree[xnew].fc = 1;
				depth[xnew] = 0;
				opt_len--;
				if (stree !== null)
					static_len -= stree[xnew].dl;
				//New is 0 or 1 so it does not have extra bits
			}
			desc.max_code = max_code;

			/*
			 * The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
			 * establish sub-heaps of increasing lengths:
			 */
			for (n = heap_len >> 1; n >= 1; n--)
				pqdownheap(tree, n);

			/*
			 * Construct the Huffman tree by repeatedly combining the least two
			 * frequent nodes.
			 */
			do
			{
				n = heap[SMALLEST];
				heap[SMALLEST] = heap[heap_len--];
				pqdownheap(tree, SMALLEST);

				m = heap[SMALLEST];//m = node of next least frequency

				//Keep the nodes sorted by frequency
				heap[--heap_max] = n;
				heap[--heap_max] = m;

				//Create a new node father of n and m
				tree[node].fc = tree[n].fc + tree[m].fc;
				if (depth[n] > depth[m] + 1)
					depth[node] = depth[n];
				else
					depth[node] = depth[m] + 1;
				tree[n].dl = tree[m].dl = node;

				//And insert the new node in the heap
				heap[SMALLEST] = node++;
				pqdownheap(tree, SMALLEST);

			}
			while (heap_len >= 2);

			heap[--heap_max] = heap[SMALLEST];

			/*
			 * At this point, the fields freq and dad are set. We can now
			 * generate the bit lengths.
			 */
			gen_bitlen(desc);

			//The field len is now set, we can generate the bit codes
			gen_codes(tree, max_code);
		}

		/**
		 * @private
		 * @param {?} tree
		 * @param {Number} max_code
		 * ? = _L24.Deflate.DeflateCT
		 * How do we declare a custom type?
		 */
		function scan_tree(tree, max_code)
		{
			/*
			 * Scan a literal or distance tree to determine the frequencies of the codes
			 * in the bit length tree. Updates opt_len to take into account the repeat
			 * counts. (The contribution of the bit length codes will be added later
			 * during the construction of bl_tree.)
			 *
			 * @param tree- the tree to be scanned
			 * @param max_code- and its largest code of non zero frequency
			 */
			var n,//Iterates over all tree elements
			    curlen,//Length of current code
			    prevlen   = -1,//Last emitted length
			    nextlen   = tree[0].dl,//Length of next code
			    count     = 0,//Eepeat count of the current code
			    max_count = 7,//Max repeat count
			    min_count = 4;//Min repeat count

			if (nextlen === 0)
			{
				max_count = 138;
				min_count = 3;
			}
			tree[max_code + 1].dl = 0xFFFF;//Guard

			for (n = 0; n <= max_code; n++)
			{
				curlen = nextlen;
				nextlen = tree[n + 1].dl;
				if (++count < max_count && curlen === nextlen)
					continue;
				else if (count < min_count)
					bl_tree[curlen].fc += count;
				else if (curlen !== 0)
				{
					if (curlen !== prevlen)
						bl_tree[curlen].fc++;
					bl_tree[REP_3_6].fc++;
				}
				else if (count <= 10)
					bl_tree[REPZ_3_10].fc++;
				else
					bl_tree[REPZ_11_138].fc++;
				count = 0;
				prevlen = curlen;
				if (nextlen === 0)
				{
					max_count = 138;
					min_count = 3;
				}
				else if (curlen === nextlen)
				{
					max_count = 6;
					min_count = 3;
				}
				else
				{
					max_count = 7;
					min_count = 4;
				}
			}
		}

		/**
		 * @private
		 * @param {?} tree
		 * @param {Number} max_code
		 * ? = _L24.Deflate.DeflateCT
		 * How do we declare a custom type?
		 */
		function send_tree(tree, max_code)
		{
			/*
			 * Send a literal or distance tree in compressed form, using the codes in
			 * bl_tree.
			 *
			 * @param tree- the tree to be scanned
			 * @param max_code- and its largest code of non zero frequency
			 */
			var n,//Iterates over all tree elements
			    curlen,//Length of current code
			    prevlen   = -1,//Last emitted length
			    nextlen   = tree[0].dl,//Length of next code
			    count     = 0,//Repeat count of the current code
			    max_count = 7,//Max repeat count
			    min_count = 4;//Min repeat count

			//tree[max_code+1].dl = -1;
			//Guard already set
			if (nextlen === 0)
			{
				max_count = 138;
				min_count = 3;
			}

			for (n = 0; n <= max_code; n++)
			{
				curlen = nextlen;
				nextlen = tree[n + 1].dl;
				if (++count < max_count && curlen === nextlen)
					continue;
				else if (count < min_count)
				{
					do
					{
						//send_code(curlen, bl_tree);
						send_bits(bl_tree[curlen].fc, bl_tree[curlen].dl);
					}
					while (--count !== 0);
				}
				else if (curlen !== 0)
				{
					if (curlen !== prevlen)
					{
						//send_code(curlen, bl_tree);
						send_bits(bl_tree[curlen].fc, bl_tree[curlen].dl);
						count--;
					}
					//send_code(REP_3_6, bl_tree);
					send_bits(bl_tree[REP_3_6].fc, bl_tree[REP_3_6].dl);
					send_bits(count - 3, 2);
				}
				else if (count <= 10)
				{
					//send_code(REPZ_3_10, bl_tree);
					send_bits(bl_tree[REPZ_3_10].fc, bl_tree[REPZ_3_10].dl);
					send_bits(count - 3, 3);
				}
				else
				{
					//send_code(REPZ_11_138, bl_tree);
					send_bits(bl_tree[REPZ_11_138].fc, bl_tree[REPZ_11_138].dl);
					send_bits(count - 11, 7);
				}
				count = 0;
				prevlen = curlen;
				if (nextlen === 0)
				{
					max_count = 138;
					min_count = 3;
				}
				else if (curlen === nextlen)
				{
					max_count = 6;
					min_count = 3;
				}
				else
				{
					max_count = 7;
					min_count = 4;
				}
			}
		}

		/**
		 * @private
		 * @returns {Number}
		 */
		function build_bl_tree()
		{
			/*
			 * Construct the Huffman tree for the bit lengths and return the index in
			 * BL_ORDER of the last bit length code to send.
			 */
			var max_blindex;//Index of last bit length code of non zero freq

			//Determine the bit length frequencies for literal and distance trees
			scan_tree(dyn_ltree, l_desc.max_code);
			scan_tree(dyn_dtree, d_desc.max_code);

			//Build the bit length tree:
			build_tree(bl_desc);
			/*
			 * opt_len now includes the length of the tree representations, except
			 * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
			 */

			/*
			 * Determine the number of bit length codes to send. The pkzip format
			 * requires that at least 4 bit length codes be sent. (appnote.txt says
			 * 3 but the actual value used is 4.)
			 */
			for (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--)
			{
				if (bl_tree[BL_ORDER[max_blindex]].dl !== 0)
					break;
			}
			//Update opt_len to include the bit length tree and counts
			opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;

			return max_blindex;
		}

		/**
		 * @private
		 * @param {Number} lcodes
		 * @param {Number} dcodes
		 * @param {Number} blcodes
		 */
		function send_all_trees(lcodes, dcodes, blcodes)
		{//Number of codes for each tree
			/*
			 * Send the header for a block using dynamic Huffman trees: the counts, the
			 * lengths of the bit length codes, the literal tree and the distance tree.
			 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
			 */
			var rank;//Index in BL_ORDER

			send_bits(lcodes - 257, 5);//Not +255 as stated in appnote.txt
			send_bits(dcodes - 1, 5);
			send_bits(blcodes - 4, 4);//Not -3 as stated in appnote.txt
			for (rank = 0; rank < blcodes; rank++)
				send_bits(bl_tree[BL_ORDER[rank]].dl, 3);

			//Send the literal tree
			send_tree(dyn_ltree, lcodes - 1);

			//Send the distance tree
			send_tree(dyn_dtree, dcodes - 1);
		}

		/**
		 * @private
		 * @param {Number} eof
		 */
		function flush_block(eof)
		{//True if this is the last block for a file
			/*
			 * Determine the best encoding for the current block: dynamic trees, static
			 * trees or store, and output the encoded block to the zip file.
			 */
			var opt_lenb, static_lenb,//opt_len and static_len in bytes
			    max_blindex,//Index of last bit length code of non zero freq
			    stored_len,//Length of input block
			    i;

			stored_len = strstart - block_start;
			flag_buf[last_flags] = flags;//Save the flags for the last 8 items

			//Construct the literal and distance trees
			build_tree(l_desc);
			build_tree(d_desc);
			/*
			 * At this point, opt_len and static_len are the total bit lengths of
			 * the compressed block data, excluding the tree representations.
			 */

			/*
			 * Build the bit length tree for the above two trees, and get the index
			 * in BL_ORDER of the last bit length code to send.
			 */
			max_blindex = build_bl_tree();

			//Determine the best encoding. Compute first the block length in bytes
			opt_lenb = (opt_len + 3 + 7) >> 3;
			static_lenb = (static_len + 3 + 7) >> 3;

			if (static_lenb <= opt_lenb)
				opt_lenb = static_lenb;
			if (stored_len + 4 <= opt_lenb && block_start >= 0)
			{//4: two words for the lengths
				/*
				 * The test buf !== NULL is only necessary if LIT_BUFSIZE > WSIZE.
				 * Otherwise we can't have processed more than WSIZE input bytes since
				 * the last block flush, because compression would have been
				 * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
				 * transform a block into a stored block.
				 */
				send_bits((STORED_BLOCK << 1) + eof, 3);//Send block type
				bi_windup();//Align on byte boundary
				put_short(stored_len);
				put_short(~stored_len);

				//Copy block
				for (i = 0; i < stored_len; i++)
					put_byte(window[block_start + i]);
			}
			else if (static_lenb === opt_lenb)
			{
				send_bits((STATIC_TREES << 1) + eof, 3);
				compress_block(static_ltree, static_dtree);
			}
			else
			{
				send_bits((DYN_TREES << 1) + eof, 3);
				send_all_trees(l_desc.max_code + 1, d_desc.max_code + 1, max_blindex + 1);
				compress_block(dyn_ltree, dyn_dtree);
			}

			init_block();

			if (eof !== 0)
				bi_windup();
		}

		/**
		 * @private
		 * @param {Number} dist
		 * @param {Number} lc
		 * @returns {Boolean}
		 */
		function ct_tally(dist, lc)
		{
			/*
			 * Save the match info and tally the frequency counts. Return true if
			 * the current block must be flushed.
			 *
			 * @param dist- distance of matched string
			 * @param lc- (match length - MIN_MATCH) or unmatched char (if dist === 0)
			 */
			l_buf[last_lit++] = lc;
			if (dist === 0)
				//lc is the unmatched char
				dyn_ltree[lc].fc++;
			else
			{
				//Here, lc is the match length - MIN_MATCH
				dist--;//dist = match distance - 1

				dyn_ltree[length_code[lc] + LITERALS + 1].fc++;
				dyn_dtree[d_code(dist)].fc++;

				d_buf[last_dist++] = dist;
				flags |= flag_bit;
			}
			flag_bit <<= 1;

			//Output the flags if they fill a byte
			if ((last_lit & 7) === 0)
			{
				flag_buf[last_flags++] = flags;
				flags                  = 0;
				flag_bit               = 1;
			}
			//Try to guess if it is profitable to stop the current block here
			if (compr_level > 2 && (last_lit & 0xFFF) === 0)
			{
				//Compute an upper bound for the compressed length
				var out_length = last_lit * 8,
				    in_length = strstart - block_start,
				    dcode;

				for (dcode = 0; dcode < D_CODES; dcode++)
					out_length += dyn_dtree[dcode].fc * (5 + EXTRA_DBITS[dcode]);
				out_length >>= 3;
				if (last_dist < ~~(last_lit / 2) && out_length < ~~(in_length / 2))
					return true;
			}
			return (last_lit === LIT_BUFSIZE - 1 || last_dist === DIST_BUFSIZE);
			/*
			 * We avoid equality with LIT_BUFSIZE because of wraparound at 64K
			 * on 16 bit machines and because stored blocks are restricted to
			 * 64K-1 bytes.
			 */
		}

		/**
		 * @private
		 * @param {?} ltree
		 * @param {?} dtree
		 * ? = _L24.Deflate.DeflateCT
		 * How do we declare a custom type?
		 */
		function compress_block(ltree, dtree)
		{
			/*
			 * Send the block data compressed using the given Huffman trees
			 *
			 * @param ltree- literal tree
			 * @param dtree- distance tree
			 */
			var dist,//Distance of matched string
			    lc,//Match length or unmatched char (if dist === 0)
			    lx   = 0,//Running index in l_buf
			    dx   = 0,//Running index in d_buf
			    fx   = 0,//Running index in flag_buf
			    flag = 0,//Current flags
			    code,//The code to send
			    extra;//Number of extra bits to send

			if (last_lit !== 0)
			{
				do
				{
					if ((lx & 7) === 0)
						flag = flag_buf[fx++];
					lc = l_buf[lx++] & 0xFF;
					if ((flag & 1) === 0)
						//send_code(lc, ltree);//Send a literal byte
						send_bits(ltree[lc].fc, ltree[lc].dl);
					else
					{
						//Here, lc is the match length - MIN_MATCH
						code = length_code[lc];
						//send_code(code + LITERALS + 1, ltree);//Send the length code
						send_bits(ltree[code + LITERALS + 1].fc, ltree[code + LITERALS + 1].dl);
						extra = EXTRA_LBITS[code];
						if (extra !== 0)
						{
							lc -= base_length[code];
							send_bits(lc, extra);//Send the extra length bits
						}
						dist = d_buf[dx++];
						//Here, dist is the match distance - 1
						code = d_code(dist);

						//send_code(code, dtree);//Send the distance code
						send_bits(dtree[code].fc, dtree[code].dl);
						extra = EXTRA_DBITS[code];
						if (extra !== 0)
						{
							dist -= base_dist[code];
							send_bits(dist, extra);//Send the extra distance bits
						}
					}//Literal or match pair?
					flag >>= 1;
				}
				while (lx < last_lit);
			}

			//send_code(END_BLOCK, ltree);
			send_bits(ltree[END_BLOCK].fc, ltree[END_BLOCK].dl);
		}

		/**
		 * @private
		 * @param {Number} value
		 * @param {Number} length
		 */
		function send_bits(value, length)
		{
			/*
			 * Send a value on a given number of bits.
			 * IN assertion: length <= 16 and value fits in length bits.
			 *
			 * @param value- value to send
			 * @param length- number of bits
			 */
			var Buf_size = 16;//Bit size of bi_buf
			/*
			 * If not enough room in bi_buf, use (valid) bits from bi_buf and
			 * (16 - bi_valid) bits from value, leaving (width - (16-bi_valid))
			 * unused bits in value.
			 */
			if (bi_valid > Buf_size - length)
			{
				bi_buf |= (value << bi_valid);
				put_short(bi_buf);
				bi_buf = (value >> (Buf_size - bi_valid));
				bi_valid += length - Buf_size;
			}
			else
			{
				bi_buf |= value << bi_valid;
				bi_valid += length;
			}
		}

		/**
		 * @private
		 * @param {Number} code
		 * @param {Number} len
		 * @returns {Number}
		 */
		function bi_reverse(code, len)
		{
			/*
			 * Reverse the first len bits of a code, using straightforward code (a faster
			 * method would use a table)
			 * IN assertion: 1 <= len <= 15
			 *
			 * @param code- the value to invert
			 * @param len- its bit length
			 */
			var res = 0;
			do
			{
				res |= code & 1;
				code >>= 1;
				res <<= 1;
			}
			while (--len > 0);
			return res >> 1;
		}

		/**
		 * @private
		 */
		function bi_windup()
		{
			//Write out any remaining bits in an incomplete byte.
			if (bi_valid > 8)
				put_short(bi_buf);
			else if (bi_valid > 0)
				put_byte(bi_buf);
			bi_buf = 0;
			bi_valid = 0;
		}

		/**
		 * @private
		 */
		function qoutbuf()
		{
			var q, i;
			if (outcnt !== 0)
			{
				q = new_queue();
				if (qhead === null)
					qhead = qtail = q;
				else
					qtail = qtail.next = q;
				q.len = outcnt - outoff;
				for (i = 0; i < q.len; i++)
					q.ptr[i] = outbuf[outoff + i];
				outcnt = outoff = 0;
			}
		}

		////////////////////////////////////////////////////////////////////////

		/* Public Methods */
		/**
		 * @description A method to compress data into the Deflate format.
		 * @public
		 * @param {String} data
		 * @param {Number} level
		 * @returns {String}
		 * @example var cdata = compress("example data", 6);
		 */
		this.compress = function(data, level)
		{
			console.time("deflate");
			console.profile("Deflate Profile");
			var i, j, buff, out = "";

			deflate_data = data;
			deflate_pos  = 0;
			if (level === undefined)
				level = DEFAULT_LEVEL;
			deflate_start(level);

			buff = [];
			while ((i = deflate_internal(buff, 0, 1024)) > 0)
			{
				//out += String.fromCharCode.apply(null, buff);//Why does this break?
				for (j = 0; j < i; j++)
					out += String.fromCharCode(buff[j]);
			}
			deflate_data = null;//G.C.
			console.profileEnd();
			console.timeEnd("deflate");
			return out;
		};
	}
	/* End GPLv2 Licensed Code */

	/* Start MIT Licensed Code */
	/**
	 * @private
	 * @class
	 * @returns {?}
	 */
	function CRC32()
	{
		/* Private Constants */
		/**
		 * @private
		 * @constant
		 */
		var POLYNOMIAL = 0xEDB88320;

		////////////////////////////////////////////////////////////////////////

		/* Public Methods */
		/**
		 * @description A method to calculate the crc32 checksum of a string.
		 * @public
		 * @param {String} data
		 * @returns {?number}
		 * @example var crc = crc32("example data");
		 * Number|_L24.CRC32.crc32.temp|_L24.CRC32.crc32.crc
		 */
		this.crc32 = function(data)
		{
			var crc = -1,//Initial contents of LFBSR.
				i, j, l, temp;

			for (i = 0, l = data.length; i < l; i++)
			{
				temp = (crc ^ data.charCodeAt(i)) & 0xFF;
				for (j = 0; j < 8; j++)//Read 8 bits, one at a time.
				{
					if ((temp & 1) === 1)
						temp = (temp >>> 1) ^ POLYNOMIAL;
					else
						temp = (temp >>> 1);
				}
				crc = (crc >>> 8) ^ temp;
			}

			return ((crc ^ -1) >>> 0);//Flip the bits of the CRC.
		};

		//Return the crc32 method since that is all this class will be for.
		return this.crc32;
	}
	/* End MIT Licensed Code */

	/**
	 * @private
	 * @class
	 * @returns {?}
	 */
	function Gzip()
	{
		/* Private Constants */
		/**
		 * @private
		 * @constant
		 */
		var crc32         = new CRC32(),
		    deflate       = new Deflate(),
		    ID1           = "\x1F",//Magic number 1
		    ID2           = "\x8B",//Magic number 2
		    CM            = "\x08",//Deflate compression type
		    FLG           = "\x00",//No extra flags
		    MTIME         = "\x00\x00\x00\x00",//Time not available
		    XFL_MIN       = "\x04",//Fastest compression level
		    XFL_MAX       = "\x02",//Maximum compression level
		    XFL_OTHER     = "\x00",//Other compression level
		    OS            = "\x03",//Unix OS
		    LEVEL_DEFAULT = 6,//Default compression level
		    LEVEL_MIN     = 1,//Minimum compression level
		    LEVEL_MAX     = 9;//Maximum compression level

		////////////////////////////////////////////////////////////////////////

		/* Private Methods */
		/**
		 * @description A method to convert a number into a byte string.
		 * @private
		 * @param {Number} value
		 * @param {Number} length
		 * @returns {String}
		 */
		function intToChars(value, length)
		{
			var chars = "";
			while (length--)
			{
				chars += String.fromCharCode(value & 0xFF);
				value  = value >>> 8;
			}
			return chars;
		}

		////////////////////////////////////////////////////////////////////////

		/* Public Methods */
		/**
		 * @description A method to compress data into the GZip format.
		 * @public
		 * @param {String} data
		 * @param {Number} level
		 * @returns {String}
		 * @example var cdata = compress("example data", 6);
		 * _L24.Gzip.compress.size|String|_L24.Gzip.compress.crc
		 */
		this.compress = function(data, level)
		{
			var header, cdata, footer,
			    xfl  = XFL_OTHER,
			    crc  = intToChars(crc32(data), 4),
			    size = intToChars(data.length % 0xFFFFFFFF, 4);

			if (level === undefined)
				level = LEVEL_DEFAULT;
			if (level < LEVEL_MIN)
				level = LEVEL_MIN;
			if (level > LEVEL_MAX)
				level = LEVEL_MAX;
			if (level === LEVEL_MIN)
				xfl = XFL_MIN;
			if (level === LEVEL_MAX)
				xfl = XFL_MAX;

			header = ID1 + ID2 + CM + FLG + MTIME + xfl + OS;
			try
			{
				cdata  = deflate.compress(data, level);
			}
			catch(e){throw e;}
			footer = crc + size;

			return header + cdata + footer;
		};
	}

	/**
	 * @description A list of supported compression types with minimum, maximum,
	 *              and default compression levels and a method to instantiate
	 *              the compressor object.
	 * @private
	 * @constant
	 * @struct
	 */
	var algorithms = {
		gzip   : {level_default: 6, level_min: 1, level_max: 9, compressorObject: function(){return new Gzip();}},//compressionLevelMin: gzip.min || 1, etc.
		deflate: {level_default: 6, level_min: 1, level_max: 9, compressorObject: function(){return new Deflate();}}//compressionLevelMin: deflate.min || 1, etc.
	};

	////////////////////////////////////////////////////////////////////////////

	$.ajaxPrefilter(function(options, originalOptions, jqXHR)
	{
		var requestType      = options.type.toUpperCase(),
		    compressionType  = DEFAULT_COMPRESSION,
		    compressionLevel = DEFAULT_COMPRESSION_LEVEL,
		    compressorObject, cdata;

		if (options.compress && (requestType === "POST" || requestType === "PUT"))
		{
			if (options.compressionType  && algorithms[options.compressionType])
				compressionType  = options.compressionType;
			if (options.compressionLevel && algorithms[compressionType].level_min <= options.compressionLevel && options.compressionLevel <= algorithms[compressionType].level_max)
				compressionLevel = options.compressionLevel;//Can we make this part of the compression classes themselves in a good way?

			try
			{
				//Get our compression object.
				compressorObject = algorithms[compressionType].compressorObject();
				//Try to compress the data, if it fails hopefully it throws an exception.
				cdata = compressorObject.compress(options.data, compressionLevel);
				//Set the encoding header and overwrite the request body data.
				jqXHR.setRequestHeader("X-Content-Encoding", compressionType);
				options.data = cdata;
			}
			catch(e){}
		}
	});
}(jQuery));
