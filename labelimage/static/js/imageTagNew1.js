function loadProgress() {
  $("[data-toggle='popover']").popover("hide");
  tagInfo = result[urlIndex].tagInfo.sort(compare("start"));
  var progress = $("#myProgress");
  progress.html("");
  for (let i in tagInfo) {
    var item = parseFloat(tagInfo[i].end) - parseFloat(tagInfo[i].start);
    var background = "";
    for (var j = 0; j < tagsArr.length; j++) {
      if (tagsArr[j][0] == tagInfo[i].tagId) {
        background = tagsArr[j][2];
      }
    }
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
      '" data-tagid="' +
      tagInfo[i].tagId +
      '" data-original-title="' +
      tagInfo[i].start +
      "s-" +
      tagInfo[i].end +
      's">' +
      "<span>" +
      tagInfo[i].tagId;
    "</span>" + "</div>";
    progress.append(progress_bar);
  }
  $("[data-toggle='popover']").popover({
    trigger: "hover",
    placement: "top",
    container: "body"
  });
}
