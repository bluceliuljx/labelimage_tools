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

function get_file_name(url) {
    s = url.lastIndexOf('/') + 1;
    e = url.lastIndexOf('.');
    return url.substring(s, e);
}

function update_tags(work_id, video_url, tags) {
    $.ajax({
        url: '/update_tags',
        data: {'work_id': work_id, 'video_url': video_url,
               'tags': JSON.stringify(tags)},
        dataType: 'json',
        success: function(result){
            if (result.code == 0) {
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus + ' ' + errorThrown);
        }
    });
}

function get_tags(work_id, video_url) {
    $.ajax({
        url: '/get_tags',
        data: {'work_id': work_id, 'video_url': video_url},
        dataType: 'json',
        success: function(result){
            if (result.code == 0) {
                resultTags = result.tags;
                var table = tagInfoToBe(resultTags);
                $(".result").html(table);
                loadProgress();
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus + ' ' + errorThrown);
        }
    });
}

function get_labels(label_file) {
    $.ajax({
        url: '/load_json',
        data: {'file': label_file},
        dataType: 'json',
        success: function(result){
            if (result.code == 0) {
                tagsArr = {};
                for (var i = 0; i < result.data.length; ++i) {
                    if (result.data[i].hasOwnProperty('color')) {
                        tagsArr[result.data[i].tag] = result[i].color;
                    }
                    else {
                        tagsArr[result.data[i].tag] = randomColor(i);
                    }
                }
                getData();
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus + ' ' + errorThrown);
        }
    });
}

function load_work(src_dir, dst_list_file) {
    $.ajax({
        url: '/load_work',
        data: {'src_dir': src_dir,
               'dst_list_file': dst_list_file,
               'classify_type': classify_type},
        dataType: 'json',
        success: function(result){
            if (result.code != 0) {
                alert("Failed: " + result.reason)
            }
            else {
                total_count = result.total_count;
                selected_count = result.selected_count;
                total_pages = Math.ceil(1.0 * result.total_count / page_count);
                work_id = result.work_id;
                page_id = 0;
                get_batch_images(work_id, page_count, page_id);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus + ' ' + errorThrown);
        }
    });
}

function save_work(work_id, dst_list_file) {
    $.ajax({
        url: '/save_work',
        data: {'work_id': work_id, 'dst_list_file': dst_list_file},
        dataType: 'json',
        success: function(result){
            if (result.code != 0) {
                alert("Failed: " + result.reason);
            }
            else {
                alert(result.count + " selected images saved to " + result.dst_file);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus + ' ' + errorThrown);
        }
    });
}

function get_batch_images(work_id, page_count, page_id) {
    $.ajax({
        url: '/get_batch_images',
        data: {'work_id': work_id, 'page_count': page_count, 'page_id': page_id},
        dataType: 'json',
        success: function(result){
            reshtml = '';
            tmpar = []
            htmlar = []
            page_video_urls = [];
            for (var i = 0; i < result.data.length; ++i) {
                hide = 'hide';
                if (result.data[i].selected) {
                    hide = '';
                }
                src_url = result.data[i].url;
                page_video_urls.push(src_url);
                if (!isshowtitle) {
                    tmpar.push(multiline(function(){/*
                        <div class="col-md-2">
                            <div class="img-container" src="#{src}">
                                <img class="hovertext #{hide}" src="/static/images/checked.png"/>
                                <video controls class="img-box">
                                    <source src="#{src}" type="video/mp4"/>
                                    Your browser does not support the video tag.
                                </video>
                                <div class="enlarge hovertag">
                                    <img src="/static/images/magnifier.png"/>
                                </div>
                                <div class="tagging hovertag" vpos="#{vpos}">
                                    <img src="/static/images/tag.png"/>
                                </div>
                            </div>
                        </div>
                    */
                    }, {'src': src_url, 'hide': hide, 'vpos': i}));
                }
                else {
                    tmpar.push(multiline(function(){/*
                        <div class="col-md-2">
                            <div class="img-container" src="#{src}">
                                <img class="hovertext #{hide}" src="/static/images/checked.png"/>
                                <p class="pre-text">#{title}</p>
                                <div class="enlarge hovertag">
                                    <img src="/static/images/magnifier.png"/>
                                </div>
                                <div class="tagging hovertag" vpos="#{vpos}">
                                    <img src="/static/images/tag.png"/>
                                </div>
                            </div>
                        </div>
                    */
                    }, {'src': src_url, 'title': get_file_name(src_url), 'hide': hide, 'vpos': i}));
                }
                if (tmpar.length % 6 == 0) {
                    htmlar.push(tmpar.join(''));
                    tmpar = [];
                }
            }
            if (tmpar.length > 0) {
                htmlar.push(tmpar.join(''));
                tmpar = [];
            }
            if (htmlar.length > 0) {
                reshtml = '<div class="row columnbtn"><div class="rowbtn">全选</div>' +
                          htmlar.join('</div><div class="row columnbtn"><div class="rowbtn">全选</div>') +
                          '</div>';
                $(".images-container").html(reshtml);
                $("#pagestat").html("图片总数: " + total_count +
                                    "&nbsp&nbsp&nbsp每页图片数: " + page_count +
                                    "&nbsp&nbsp&nbsp总页数: " + total_pages +
                                    "&nbsp&nbsp&nbsp已选图片数: " + selected_count +
                                    "&nbsp&nbsp&nbsp当前页数: " + page_id);
                initcallbacks();
                if (!$(".tagging-modal").is(":hidden")) {
                    if (page_direct == 1) {
                        vpos = 0;
                    }
                    else {
                        vpos = page_video_urls.length - 1;
                    }
                    showTaggingWindow(page_video_urls[vpos]);
                }
            }
            else {
                alert("No more images.");
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus + ' ' + errorThrown);
        }
    });
}

$(document).keydown(function(e){
    if ($(document.activeElement).is('input')) {
        return;
    }
    if (e.which == 68) { // d
        if (!$(".tagging-modal").is(":hidden") && (page_video_urls.length - 1 > vpos)) {
            vpos = vpos + 1;
            showTaggingWindow(page_video_urls[vpos]);
        }
        else {
            page_direct = 1;
            page_id = page_id + page_direct;
            get_batch_images(work_id, page_count, page_id);
        }
    }
    else if (e.which == 65) { // a
        if (!$(".tagging-modal").is(":hidden") && (vpos > 0)) {
            vpos = vpos - 1;
            showTaggingWindow(page_video_urls[vpos]);
        }
        else if (page_id > 0) {
            page_direct = -1;
            page_id = page_id + page_direct;
            get_batch_images(work_id, page_count, page_id);
        }
    }
    else if (e.which == 83) { // s
        if (!$(".tagging-modal").is(":hidden")) {
            update_tags(work_id, video_url, resultTags);
        }
        dst_list_file = $("#dstlistinput").val();
        save_work(work_id, dst_list_file);
    }
    else if (e.which == 90) { // z
        tc = $(mouseCtrl);
        while (!tc.hasClass("images-container")) {
            if (tc.hasClass("row")) {
                tc.children(".rowbtn").click();
                break;
            }
            tc = tc.parent();
        }
    }
});

function resize_enlarge_window(naturalWidth, naturalHeight, targetTagname) {
    width = naturalWidth;
    height = naturalHeight;
    if (width > document.documentElement.clientWidth / 2 - 60) {
        width = Math.floor(document.documentElement.clientWidth / 2 - 60);
        height = Math.floor(1.0 * naturalHeight * width / naturalWidth);
    }
    if (height > document.documentElement.clientHeight - 60) {
        height = document.documentElement.clientHeight - 60;
        width = Math.floor(1.0 * naturalWidth * height / naturalHeight);
    }
    $(".enlarge-window").css("width", width + 8);
    $(".enlarge-window").css("height", height + 8);
    $(".enlarge-window " + targetTagname).css("width", width);
    $(".enlarge-window " + targetTagname).css("height", height);
}

function showTaggingWindow(vurl) {
    video_url = vurl;
    $(".modelLeft video source").attr("src", video_url);
    $(".modal-header").html('<a href="' + video_url + '" target="_blank">' + get_file_name(video_url) + '</a>' +
                            '<a class="closetagw" onclick="closeTagWindow()">X</a>');
    player.onloadeddata = function() {
        width = $("#progress").width();
        duration = player.duration;
        get_tags(work_id, video_url);
    };
    player.ontimeupdate = function() {
        width = $("#progress").width();
        $("#current")[0].innerText = parseInt(player.currentTime).toFixed(1);
        $("#progressbar").width((player.currentTime / player.duration) * width);
        if (tagplay && (player.currentTime >= tagend)) {
            tagplay = false;
            player.pause();
        }
    };
    $(".tagging-modal").fadeIn();
    player.load();
}

function initcallbacks() {
    $(".img-box").one("load", function() {
        if (this.naturalWidth > this.naturalHeight) {
            rh = img_borber_size * 1.0 * this.naturalHeight / this.naturalWidth;
            marginTop = Math.floor((img_borber_size - rh) / 2 + 0.5);
            $(this).css("margin-top", marginTop);
            $(this).css("width", "180px");
            $(this).css("height", "auto");
        }
        else {
            rw = img_borber_size * 1.0 * this.naturalWidth / this.naturalHeight;
            marginLeft = Math.floor((img_borber_size - rw) / 2 + 0.5);
            $(this).css("margin-left", marginLeft);
            $(this).css("width", "auto");
            $(this).css("height", "180px");
        }
    }).each(function() {
        if(this.complete) $(this).trigger("load");
    });

    $(".tagging").click(function(e){
        e.stopPropagation();
        resultTags = [];
        activeTime = [];
        vpos = parseInt($(this).attr("vpos"));
        showTaggingWindow(page_video_urls[vpos]);
    });

    $(".img-container").mouseover(function(e){
        $(this).css("border-style", "groove");
//        e.stopPropagation();
    });

    $(".img-container").mouseout(function(e){
        $(this).css("border-style", "none");
//        e.stopPropagation();
    });

    $(".rowbtn").mouseover(function(e){
        $(this).parent().css("border-style", "groove");
        e.stopPropagation();
    });

    $(".rowbtn").mouseout(function(e){
        $(this).parent().css("border-style", "none");
        e.stopPropagation();
    });

    $(".rowbtn").click(function(e){
        $(this).parent().find(".img-container").click();
    });

    $(".enlarge").mouseover(function(e){
        naturalWidth = 1;
        naturalHeight = 1;
        if (isshowtitle) {
            srcTag = $(this).parent().children(".tagging");
            video_url = page_video_urls[parseInt(srcTag.attr("vpos"))];
            $(".enlarge-window video source").attr("src", video_url);
            $(".enlarge-window img").addClass('hide');
            $(".enlarge-window video").removeClass('hide');
            naturalWidth = 640;
            naturalHeight = 480;
            resize_enlarge_window(naturalWidth, naturalHeight, 'video');
            $(".enlarge-window video").get(0).load();
        }
        else {
            srcTag = $(this).parent().children(".img-box");               // video
            video_url = srcTag.children('source').attr("src");
            $(".enlarge-window video source").attr("src", video_url);
            $(".enlarge-window img").addClass('hide');
            $(".enlarge-window video").removeClass('hide');
            t = srcTag.get(0);
            naturalWidth = t.videoWidth;
            naturalHeight = t.videoHeight;
            resize_enlarge_window(naturalWidth, naturalHeight, 'video');
            $(".enlarge-window video").get(0).load();
        }
        this_left = $(this).offset().left;
        left = 0;
        if (this_left * 2 < document.documentElement.clientWidth) {
            left = this_left + 85;
        }
        else {
            left = this_left - 110 - $(".enlarge-window").width();
        }
        topy = $(this).offset().top - 30;
        absTop = document.documentElement.scrollTop + document.documentElement.clientHeight;
        if (topy + $(".enlarge-window").height() + 20 > absTop) {
            topy = absTop - $(".enlarge-window").height() - 20;
        }
        if (topy - 4 < document.documentElement.scrollTop) {
            topy = document.documentElement.scrollTop + 4;
        }
        $(".enlarge-window").css("left", left + "px");
        $(".enlarge-window").css("top", topy + "px");
        $(".enlarge-window").removeClass("hide");
        if (!$(".enlarge-window video").hasClass('hide')) {
            $(".enlarge-window video").get(0).play();
        }
    });

    $(".enlarge").mouseout(function(e){
        $(".enlarge-window video").get(0).pause();
        $(".enlarge-window").addClass("hide");
    });
}

var resultTags = [];
var activeTime = [];
var video_url = 0;
var page_video_urls = [], vpos = 0, page_direct = 1;
var tagplay = false, tagstart = 0, tagend = 1;
var tagsArr = {};
var duration = 1;
player = $(".modelLeft video").get(0);
var color = [
    "#E14A63",
    "#F3AA4D",
    "#C4C400",
    "#99CC99",
    "#2891DB",
    "#003366",
    "#996699",
    "#996633",
    "#999999",
    "#FF9999"
];
function randomColor(index) {
    if (index < 10) {
        return color[index];
    }
    var hex = Math.floor(Math.random() * 0xffffff).toString(16);
    while (hex.length < 6) {
        hex = "0" + hex;
    }
    return `#${hex}`;
}

function changeSeek(start, end, id, flag) {
    window.event.stopPropagation();
    player.currentTime = start;
    player.play();
    tagplay = true;
    tagstart = start;
    tagend = end;
    $("#current")[0].innerText = parseFloat(start);
    $("#progressbar").width((start / duration) * width);
    activeTimeId = id;
    activeTime = [start, end];
    toActiveTime(true);
}
function enableRadio() {
  var radios = $('input[type="radio"]');
  for (var i = 0; i < radios.length; i++) {
    $(radios[i])[0].disabled = false;
  }
}
function disableRadio() {
  var radios = $('input[type="radio"]');
  for (var i = 0; i < radios.length; i++) {
    radios[i].disabled = true;
    radios[i].checked = false;
  }
}
function toActiveTime(flag) {
  if (flag) {
//    $(".delTagBtn").show();
    enableRadio();
  } else {
    if (activeTime.length == 0 || activeTime.length == 1) {
//      $(".delTagBtn").hide();
      disableRadio();
    } else if (activeTime.length == 2) {
//      $(".delTagBtn").show();
      enableRadio();
      var start = parseFloat(activeTime[0]);
      var end = parseFloat(activeTime[1]);
      var item = start;
      if (start > end) {
        start = end;
        end = item;
      }
      var background = "#ccc";
      addProgress(start, end, background);
    }
  }
}

function changeTag(item) {
  if (activeTime.length > 0) {
    var my_progress_bar = $(".my-progress-bar");
    var tag = $(item)[0].nextSibling.innerText;
    if ($(item)[0].nextSibling.tagName == 'INPUT') {
        tag = $(item)[0].nextSibling.value;
    }
    var start = parseFloat(activeTime[0]);
    var end = parseFloat(activeTime[1]);
    var id = $(".my-progress-bar").length + 1;
    var flag = false;
    for (let i = 0; i < my_progress_bar.length; i++) {
      if (my_progress_bar[i].dataset.content) {
        if ($(".my-progress-bar")[i].id == activeTimeId) {
          id = activeTimeId;
          $(".my-progress-bar")[i].remove();
          flag = true;
          activeTimeId = "";
          break;
        }
      }
    }
    activeTimeId = "";
    if (!flag) {
      loadProgress();
    }
    var progress = $("#myProgress");
    var item = parseFloat(end) - parseFloat(start);
    var background;
    if (!tagsArr.hasOwnProperty(tag)) {
        tagsArr[tag] = randomColor(100);
    }
    background = tagsArr[tag];
    var percent = item / duration;
    var progress_bar =
      '<div id="' +
      id +
      '" onclick="changeSeek(' +
      start +
      "," +
      end +
      "," +
      id +
      ')"class="my-progress-bar"' +
      'style="background:' +
      background +
      ";width:" +
      percent * width +
      "px;left:" +
      (start / duration) * width +
      'px;"' +
      ' role="progressbar" aria-valuemin="0" aria-valuemax="100"' +
      ' data-toggle="popover" rel="popover" data-content="' +
      tag +
      '" data-original-title="' +
      start +
      "s-" +
      end +
      's">' +
      "<span>" +
      tag
    "</span>" + "</div>";
    progress.append(progress_bar);
    $("[data-toggle='popover']").popover({
      trigger: "hover",
      placement: "top",
      container: "body"
    });
    activeTime = [];
    toActiveTime();
    saveTimeInfo();
  }
  disableRadio();
}
function goHere(self, tagInfo) {
    var index = $(self)[0].rowIndex;
    changeSeek(
        parseFloat(tagInfo.start),
        parseFloat(tagInfo.end),
        index,
        true
    );
}
function delTag(index) {
    newTagInfo = [];
    for (var i in resultTags) {
        if (i != index) {
            newTagInfo.push(tagInfo[i]);
        }
    }
    resultTags = newTagInfo.sort(compare("start"));
    var table = tagInfoToBe(resultTags);
    $(".result").html(table);
    loadProgress();
}
function tagInfoToBe(tagInfo) {
  var table = "";
  if (tagInfo.length > 0) {
    table +=
      "<table style='width: 100%;' class='table'><thead><th>Tag</th><th>Start</th><th>End</th><th>Op</th></thead><tbody>";
    for (var i in tagInfo) {
      if (tagInfo[i].start == tagInfo[i].end) {
        table +=
          "<tr data-toggle='tooltip' title='" + tagInfo[i].tag +
          "' class='rtag' style='color:red;font-weight:bolder' onclick='goHere(this," +
          JSON.stringify(tagInfo[i]) +
          ")'>";
      } else {
        table +=
          "<tr data-toggle='tooltip' title='" + tagInfo[i].tag +
          "' class='rtag' onclick='goHere(this," + JSON.stringify(tagInfo[i]) + ")'>";
      }
      for (var key in tagInfo[i]) {
        if (key == "start" || key == "end") {
          table += "<td>" + parsetomin(tagInfo[i][key]) + "</td>";
        } else {
          table += "<td style='overflow:hidden;max-width: 0;text-overflow: ellipsis;white-space: nowrap;'>" +
                   tagInfo[i][key] + "</td>";
        }
      }
      table += "<td class='btn btn-danger' onclick='delTag(" + i + ")'>X</td>";
      table += "</tr>";
    }
    table += "</tbody></table>";
  }
  return table;
}
function compare(property) {
  return function(a, b) {
    var value1 = a[property];
    var value2 = b[property];
    return value1 - value2;
  };
}
function saveTimeInfo() {
    var my_progress_bar = $(".my-progress-bar");
    var newTagInfo = [];
    for (var i = 0; i < my_progress_bar.length; i++) {
      if (my_progress_bar[i].dataset.originalTitle) {
        var arr = my_progress_bar[i].dataset.originalTitle.split("-");
        var obj = {
          tag: my_progress_bar[i].dataset.content,
          start: arr[0].slice(0, -1),
          end: arr[1].slice(0, -1)
        };
        newTagInfo.push(obj);
      }
    }
    resultTags = newTagInfo.sort(compare("start"));
    var table = tagInfoToBe(resultTags);
    $(".result").html(table);
    loadProgress();
}

function addProgress(start, end, background) {
  var progress = $("#myProgress");
  var percent = (end - start) / duration;
  var id = $(".my-progress-bar").length + 1;
  var progress_bar =
    '<div id="' +
    id +
    '" class="my-progress-bar"' +
    'style="background:' +
    background +
    ";width:" +
    percent * width +
    "px;left:" +
    (start / duration) * width +
    'px;"' +
    ' role="progressbar" aria-valuemin="0" aria-valuemax="100"' +
    ' data-toggle="popover" rel="popover"' +
    '" data-original-title="' +
    start +
    "s-" +
    end +
    's">' +
    "</div>";
  progress.append(progress_bar);
  $("[data-toggle='popover']").popover({
    trigger: "hover",
    placement: "top",
    container: "body"
  });
}

function loadProgress() {
  $("[data-toggle='popover']").popover("hide");
  var progress = $("#myProgress");
  progress.html("");
  tagInfo = resultTags.sort(compare("start"));
  for (let i in tagInfo) {
    var item = parseFloat(tagInfo[i].end) - parseFloat(tagInfo[i].start);
    var background = "";
    if (!tagsArr.hasOwnProperty(tagInfo[i].tag)) {
        tagsArr[tagInfo[i].tag] = randomColor(100);
    }
    background = tagsArr[tagInfo[i].tag];
    var percent = item / duration;
    var type = i % 2 == 0 ? "warning" : "danger";
    var id = $(".my-progress-bar").length + 1;
    var progress_bar =
      '<div id="' +
      id +
      '" onclick="changeSeek(' +
      tagInfo[i].start +
      "," +
      tagInfo[i].end +
      "," +
      id +
      ')"class="my-progress-bar"' +
      'style="background:' +
      background +
      ";width:" +
      percent * width +
      "px;left:" +
      (tagInfo[i].start / duration) * width +
      'px;"' +
      ' role="progressbar" aria-valuemin="0" aria-valuemax="100"' +
      ' data-toggle="popover" rel="popover" data-content="' +
      tagInfo[i].tag +
      '" data-original-title="' +
      tagInfo[i].start + "s-" +
      tagInfo[i].end + 's">' +
      "<span>" +
      tagInfo[i].tag;
    "</span>" + "</div>";
    progress.append(progress_bar);
  }
  $("[data-toggle='popover']").popover({
    trigger: "hover",
    placement: "top",
    container: "body"
  });
}

function changeActiveTime(time) {
  var length = activeTime.length;
  if (length == 0) {
    activeTime.push(time);
  } else if (length == 1) {
    if (parseFloat(time) - parseFloat(activeTime[0]) == 0) {
      console.log("Repeat");
    } else {
      activeTimeId = "";
      activeTime.push(time);
      var start = 0;
      var end = 0;
      start = parseFloat(activeTime[0]);
      end = parseFloat(activeTime[1]);
      var item = start;
      if (start > end) {
        start = end;
        end = item;
      }
      var flag = false;
      for (var i = 0; i < resultTags.length; i++) {
        if (
          start <= parseFloat(resultTags[i].start) &&
          end >= parseFloat(resultTags[i].end)
        ) {
          flag = true;
          break;
        }
      }
      if (!flag) {
        activeTime = [start, end];
      } else {
        showTip("No coverage", "warning", "500");
        loadProgress();
        activeTime = [];
      }
    }
  } else {
    loadProgress();
    activeTime = [];
    activeTime.push(time);
  }
  toActiveTime();
  if (activeTime.length == 1) {
    var start = activeTime[0];
    var progress = $("#myProgress");
    var id = $(".my-progress-bar").length + 1;
    var progress_bar =
      '<div id="' +
      id +
      '" class="my-progress-bar"' +
      'style="background:black;width:2px;' +
      "left:" +
      (start / duration) * width +
      'px;">' +
      "</div>";
    progress.append(progress_bar);
  }
}

function initProgress() {
    $("#progress").off("click").on("click", function(e) {
      player.pause();
      bgleft = $("#progress").offset().left;
      left = e.pageX - bgleft;
      $("#progressbar").width(left);
      var seekTo = (left / width) * duration;
      if (parseInt((left / width) * duration) >= duration) {
        seekTo = duration;
      }
      player.currentTime = seekTo;
      $("#current")[0].innerText = parseFloat(seekTo).toFixed(1);
    });
    $("#progress").on("mousemove", function(e) {
      player.pause();
      tagplay = false;
      bgleft = $("#progress").offset().left;
      left = e.pageX - bgleft;
      $("[data-toggle='popover']").popover();
      $("#progressbar").width(left);
      var seekTo = (left / width) * duration;
      if (parseInt((left / width) * duration) >= duration) {
        seekTo = duration;
      }
      player.currentTime = seekTo;
      $("#current")[0].innerText = parseFloat(seekTo).toFixed(1);
    });
    $("#myProgress").on("mousemove", function(e) {
      player.pause();
      tagplay = false;
      bgleft = $("#progress").offset().left;
      left = e.pageX - bgleft;
      $("[data-toggle='popover']").popover();
      $("#progressbar").width(left);
      var seekTo = (left / width) * duration;
      if (parseInt((left / width) * duration) >= duration) {
        seekTo = duration;
      }
      player.currentTime = seekTo;
      $("#current")[0].innerText = parseFloat(seekTo).toFixed(1);
    });
    $("#myProgress").off("click").on("click", function(e) {
      player.pause();
      bgleft = $("#myProgress").offset().left;
      left = e.pageX - bgleft;
      $("#progressbar").width(left);

      var seekTo = parseFloat((left / width) * duration).toFixed(1);
      if (left > width) {
        seekTo = duration;
      }
      player.currentTime = seekTo;
      $("#current")[0].innerText = parseFloat(seekTo).toFixed(1);
      console.log("seekTo: " + seekTo);

      var flag = false;
      for (var i = 0; i < resultTags.length; i++) {
        if (
          seekTo >= parseFloat(resultTags[i].start) &&
          seekTo <= parseFloat(resultTags[i].end)
        ) {
          flag = true;
          activeTime = [];
          break;
        }
      }
      if (!flag) {
        changeActiveTime(seekTo);
      }
    });
}

function getData() {
  $(".radioBox").html("");
  radio = '<div class="radio"><label>' +
      '<input class="inputtag" type="radio" name="tag" onchange="changeTag(this)" value="fsdfasd" disabled="">' +
      '<input style="width:280px;" type="edit">' +
      '</label></div>';
  $(".radioBox").append(radio);
  for (tag in tagsArr) {
    var radio = "<div class='radio'><label>";
    radio +=
      "<input type='radio' disabled name='tag' onchange='changeTag(this)' value='" +
      tag + "'>" + "<span>" + tag;
    radio +=
      "</label><p style='float:right;;width:10px;height:16px;border-radio:10px;background:" +
      tagsArr[tag] +
      "'></p></div>";
    $(".radioBox").append(radio);
  }
}

function closeTagWindow() {
    player.pause();
    $(".tagging-modal").fadeOut();
    update_tags(work_id, video_url, resultTags);
}

function parsetomin(secs) {
    if (secs >= 60) {
        return parseInt(secs / 60).toString() + 'm' +
               (secs % 60).toFixed(1).toString() + 's';
    }
    return secs.toString() + 's';
}
