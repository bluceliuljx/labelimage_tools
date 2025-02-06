// Empty JS for your own code to be here
function heredoc(func) {
	// get function code as string
	var hd = func.toString();

	// remove { /* using a regular expression
	hd = hd.replace(/(^.*\{\s*\/\*\s*)/g, '');

	// remove */ } using a regular expression
	hd = hd.replace(/(\s*\*\/\s*\}.*)$/g, '');

	// return output
	return hd;
}

function gen_href(cnt, url) {
	if (cnt <= 0) {
		return '<a>0</a>';
	}
	return '<a href="' + url + '" target="_blank">' + cnt + '</a>';
}

function check_equals(tags) {
    for (var i = 1; i < tags.length; ++i) {
        if (tags[i] != tags[0]) {
            return false;
        }
    }
    return true;
}

function construct_vio_table(data) {
	htmlar = [];
	htmlar.push(multiline(function(){/*
		<thead>
			<tr>
				<th rowspan="2" style="width: 100px;">
					违规类型
				</th>
				<th rowspan="2" style="width: 160px;">
					描述
				</th>
				<th colspan="2" class="parth">
					识别出&nbsp#{hit}
				</th>
				<th colspan="2" class="parth">
					未识别出&nbsp#{missed}
				</th>
			</tr>
			<tr>
				<th class="subth">
					国内&nbsp#{domestichit}
				</th>
				<th class="subth">
					国外&nbsp#{overseahit}
				</th>
				<th class="subth">
					国内&nbsp#{domesticmissed}
				</th>
				<th class="subth">
					国外&nbsp#{overseamissed}
				</th>
			</tr>
		</thead>
	*/}, {
		'hit': gen_href(data.hit.cnt, data.hit.url),
		'missed': gen_href(data.missed.cnt, data.missed.url),
		'domestichit': gen_href(data.hit.domestic.cnt, data.hit.domestic.url),
		'overseahit': gen_href(data.hit.oversea.cnt, data.hit.oversea.url),
		'domesticmissed': gen_href(data.missed.domestic.cnt, data.missed.domestic.url),
		'overseamissed': gen_href(data.missed.oversea.cnt, data.missed.oversea.url)
	}));
	htmlar.push('<tbody>');
    for (var i = 0; i < data.hit.domestic.details.length; i++) {
        tags = [
            data.hit.domestic.details[i].tag,
            data.hit.oversea.details[i].tag,
            data.missed.domestic.details[i].tag,
            data.missed.oversea.details[i].tag,
        ]
        if (!check_equals(tags)) {
            alert("data format not supported.");
            return '';
        }
		vior = tags[0].split('-');
		if (vior.length < 2) {
		    bgcolor = '#0DD';
		}
		else {
		    bgcolor = '#FFF';
		}
        htmlar.push(multiline(function(){/*
            <tr bgcolor="#{bgcolor}">
                <td>
                    #{wtype}
                </td><td>
                    #{des}
                </td><td>
                    #{domestichit}
                </td><td>
                    #{overseahit}
                </td><td>
                    #{domesticmissed}
                </td><td>
                    #{overseamissed}
                </td>
            </tr>
        */}, {
            'bgcolor': bgcolor,
            'wtype': tags[0],
            'des': data.hit.domestic.details[i].desc,
            'domestichit': gen_href(data.hit.domestic.details[i].cnt, data.hit.domestic.details[i].url),
            'overseahit': gen_href(data.hit.oversea.details[i].cnt, data.hit.oversea.details[i].url),
            'domesticmissed': gen_href(data.missed.domestic.details[i].cnt, data.missed.domestic.details[i].url),
            'overseamissed': gen_href(data.missed.oversea.details[i].cnt, data.missed.oversea.details[i].url)
        }));
	}
	htmlar.push('</tbody>');
	return htmlar.join('');
}

function construct_wpush_table(data, tag) {
    htmlar = [];
	htmlar.push(multiline(function(){/*
		<thead>
			<tr>
				<th rowspan="1" style="width: 100px;">
					类别
				</th>
				<th rowspan="1" style="width: 160px;">
					描述
				</th>
				<th colspan="1" class="parth">
					国内&nbsp#{dm}
				</th>
				<th colspan="1" class="parth">
					国外&nbsp#{ov}
				</th>
			</tr>
		</thead>
	*/}, {
		'dm': gen_href(data.domestic.cnt, data.domestic.url),
		'ov': gen_href(data.oversea.cnt, data.oversea.url),
	}));
	htmlar.push('<tbody>');
    for (var i = 0; i < data.domestic[tag].length; i++) {
        tags = [
            data.domestic[tag][i].tag,
            data.domestic[tag][i].tag
        ]
        if (!check_equals(tags)) {
            alert("data format not supported.");
            return '';
        }
        if (data.domestic[tag][i].cnt == 0 && data.oversea[tag][i].cnt == 0) {
            continue;
        }
        htmlar.push(multiline(function(){/*
            <tr">
                <td>
                    #{tag}
                </td><td>
                    #{desc}
                </td><td>
                    #{domesticwp}
                </td><td>
                    #{overseawp}
                </td>
            </tr>
        */}, {
            'tag': tags[0],
            'desc': data.domestic[tag][i].desc,
            'domesticwp': gen_href(data.domestic[tag][i].cnt, data.domestic[tag][i].url),
            'overseawp': gen_href(data.oversea[tag][i].cnt, data.oversea[tag][i].url)
        }));
    }
	htmlar.push('</tbody>');
	return htmlar.join('');
}

function render_stat_page(data) {
	$("#viotab").html(construct_vio_table(data));
	$("#awptab").html(construct_wpush_table(data.wrongpush, 'appids'));
	$("#mwptab").html(construct_wpush_table(data.wrongpush, 'models'));
}

function load_stat(stat_file) {
	$.ajax({
        url: '/load_json',
        data: {'file': stat_file},
        dataType: 'json',
        success: function(result){
            if (result.code != 0) {
                alert("Failed: " + result.reason)
            }
            else {
                render_stat_page(result.data);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus + ' ' + errorThrown);
        }
    });
}
