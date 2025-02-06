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

function select_sample(work_id, img_url, hover_mask) {
    $.ajax({
        url: '/select_sample',
        data: {'work_id': work_id, 'img_url': img_url},
        dataType: 'json',
        success: function(result){
            if (result.code == 0) {
                hover_mask.removeClass('hide');
                selected_count = result.selected_count;
                $("#pagestat").html("图片总数: " + total_count +
                                    "&nbsp&nbsp&nbsp每页图片数: " + page_count +
                                    "&nbsp&nbsp&nbsp总页数: " + total_pages +
                                    "&nbsp&nbsp&nbsp已选图片数: " + selected_count +
                                    "&nbsp&nbsp&nbsp当前页数: " + page_id);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(textStatus + ' ' + errorThrown);
        }
    });
}

function deselect_sample(work_id, img_url, hover_mask) {
    $.ajax({
        url: '/deselect_sample',
        data: {'work_id': work_id, 'img_url': img_url},
        dataType: 'json',
        success: function(result){
            if (result.code == 0) {
                hover_mask.addClass('hide');
                selected_count = result.selected_count;
                $("#pagestat").html("图片总数: " + total_count +
                                    "&nbsp&nbsp&nbsp每页图片数: " + page_count +
                                    "&nbsp&nbsp&nbsp总页数: " + total_pages +
                                    "&nbsp&nbsp&nbsp已选图片数: " + selected_count +
                                    "&nbsp&nbsp&nbsp当前页数: " + page_id);
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
            for (var i = 0; i < result.data.length; ++i) {
                hide = 'hide';
                if (result.data[i].selected) {
                    hide = '';
                }
                src_url = result.data[i].url;
                if (classify_type == 'video') {
                    tmpar.push(multiline(function(){/*
                        <div class="col-md-2">
                            <div class="img-container" src="#{src}">
                                <img class="hovertext #{hide}" src="/static/images/checked.png"/>
                                <video controls class="img-box">
                                    <source src="#{src}" type="video/mp4"/>
                                    Your browser does not support the video tag.
                                </video>
                                <div class="enlarge">
                                    <img src="/static/images/magnifier.png"/>
                                </div>
                            </div>
                        </div>
                    */
                    }, {'src': src_url, 'hide': hide}));
                }
                else {
                    tmpar.push(multiline(function(){/*
                        <div class="col-md-2">
                            <div class="img-container" src="#{src}">
                                <img class="hovertext #{hide}" src="/static/images/checked.png"/>
                                <img class="img-box"
                                     src="#{src}"/>
                                <div class="enlarge">
                                    <img src="/static/images/magnifier.png"/>
                                </div>
                            </div>
                        </div>
                    */
                    }, {'src': src_url, 'hide': hide}));
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
        page_id = page_id + 1;
        get_batch_images(work_id, page_count, page_id);
    }
    else if (e.which == 65) { // a
        if (page_id <= 0) {
            return;
        }
        page_id = page_id - 1;
        get_batch_images(work_id, page_count, page_id);
    }
    else if (e.which == 83) { // s
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

    $(".img-container").click(function(e){
        if ($(this).children(".hovertext").hasClass("hide")) {
            select_sample(work_id, $(this).attr("src"), $(this).children(".hovertext"));
        }
        else {
            deselect_sample(work_id, $(this).attr("src"), $(this).children(".hovertext"));
        }
        e.stopPropagation();
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
        srcTag = $(this).parent().children(".img-box");
        if (srcTag[0].tagName == 'IMG') {  // image
            img_url = srcTag.attr("src");
            $(".enlarge-window img").attr("src", img_url);
            $(".enlarge-window img").removeClass('hide');
            $(".enlarge-window video").addClass('hide');
            t = srcTag.get(0);
            naturalWidth = t.naturalWidth;
            naturalHeight = t.naturalHeight;
            resize_enlarge_window(naturalWidth, naturalHeight, 'img');
        }
        else {                                                  // video
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
        scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        absTop = scrollTop + document.documentElement.clientHeight;
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
