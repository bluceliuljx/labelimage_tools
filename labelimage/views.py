#!/usr/bin/python3
# -*- coding: UTF-8 -*-
from django.shortcuts import render
import os
from django.http import JsonResponse, HttpResponse
from apscheduler.schedulers.background import BackgroundScheduler
import time
import atexit
import pdb
import copy
import json
import socket
from functools import partial
import logging


logging.basicConfig(
    filename='logger.log', 
    level=logging.INFO, 
    format='[%(asctime)s] %(filename)s: %(levelname)s %(message)s', 
    datefmt='%Y-%m-%d %H:%M:%S')


def hello(request):
    return HttpResponse('Hello world ! ')


def mainpage(request):
    src = request.GET.get('src')
    dst = request.GET.get('dst')
    page_count = request.GET.get('pc')
    src = "" if src is None else src
    dst = "" if dst is None else dst
    page_count = 180 if page_count is None else page_count
    return render(request, 'index.html', \
        {'src': src, 'dst': dst, 'page_count': page_count, 'classify_type': 'image'})


def videopage(request):
    src = request.GET.get('src')
    dst = request.GET.get('dst')
    page_count = request.GET.get('pc')
    src = "" if src is None else src
    dst = "" if dst is None else dst
    page_count = 30 if page_count is None else page_count
    return render(request, 'index.html', \
        {'src': src, 'dst': dst, 'page_count': page_count, 'classify_type': 'video'})


def segannotpage(request):
    src = request.GET.get('src')
    dst = request.GET.get('dst')
    src = "" if src is None else src
    dst = "" if dst is None else dst
    return render(request, 'segannot.html', {'src': src, 'dst': dst, 'classify_type': 'videotags'})


def shortvideostat(request):
    stat_file = request.GET.get('stat')
    stat_file = "" if stat_file is None else stat_file
    return render(request, 'shortvideostat.html', {'stat_file': stat_file})


def load_json(request):
    file = request.GET.get('file')
    file = "" if file is None else file
    try:
        f = open(file, 'r')
        res = json.load(f)
        f.close()
        return JsonResponse({'code': 0, 'data': res})
    except Exception as e:
        return JsonResponse({'code': -1, 'reason': e})


def select_sample(request):
    work_id = request.GET.get('work_id')
    img_url = request.GET.get('img_url')
    status, reason, selected_count = handle_select_sample(work_id, img_url)
    if not status:
        return JsonResponse({'code': -1, 'reason': reason})
    logging.info('select_sample: work_id=' + work_id + ', remote_ip=' + request.META['REMOTE_ADDR'] + ', url=' + img_url)
    return JsonResponse({'code': 0, 'selected_count': selected_count})


def deselect_sample(request):
    work_id = request.GET.get('work_id')
    img_url = request.GET.get('img_url')
    status, reason, selected_count = handle_deselect_sample(work_id, img_url)
    if not status:
        return JsonResponse({'code': -1, 'reason': reason})
    logging.info('deselect_sample: work_id=' + work_id + ', remote_ip=' + request.META['REMOTE_ADDR'] + ', url=' + img_url)
    return JsonResponse({'code': 0, 'selected_count': selected_count})


def update_tags(request):
    work_id = request.GET.get('work_id')
    video_url = request.GET.get('video_url')
    tags = request.GET.get('tags')
    status, reason, tags_count = handle_update_tags(work_id, video_url, tags)
    if not status:
        return JsonResponse({'code': -1, 'reason': reason})
    return JsonResponse({'code': 0, 'tags_count': tags_count})


def get_tags(request):
    work_id = request.GET.get('work_id')
    video_url = request.GET.get('video_url')
    status, reason, selected_count, tags = handle_get_tags(work_id, video_url)
    if not status:
        return JsonResponse({'code': -1, 'reason': reason})
    return JsonResponse({'code': 0, 'tags_count': selected_count, 'tags': tags})


def load_work(request):
    src_dir = request.GET.get('src_dir')
    dst_list_file = request.GET.get('dst_list_file')
    classify_type = request.GET.get('classify_type')
    status, reason, work_id, total_count, selected_count =\
        handle_load_work(str(src_dir), str(dst_list_file), classify_type)
    if not status:
        return JsonResponse({'code': -1, 'reason': reason})
    return JsonResponse({'code': 0, 'work_id': work_id,
                         'total_count': total_count, 'selected_count': selected_count})


def save_work(request):
    work_id = request.GET.get('work_id')
    dst_list_file = request.GET.get('dst_list_file')
    status, reason, count, dst_file = handle_save_work(work_id, dst_list_file)
    # for t_work_id in workspace.keys():
    #     work = workspace[t_work_id]
    #     if work['dst_list_file'] == dst_list_file:
    #         handle_merge_work(t_work_id, dst_list_file)
    if not status:
        return JsonResponse({'code': -1, 'reason': reason})
    return JsonResponse({'code': 0, 'work_id': work_id, 'count': count, 'dst_file': dst_file})


def get_batch_images(request):
    work_id = request.GET.get('work_id')
    page_count = int(request.GET.get('page_count'))
    page_id = int(request.GET.get('page_id'))
    res = handle_get_batch_images(work_id, page_count, page_id)
    return JsonResponse({'code': 0, 'data': res})


def save_all_work(request):
    for work_id in workspace.keys():
        handle_merge_work(work_id)
    return JsonResponse({'code': 0, 'work_count': len(workspace)})


def handle_select_sample(work_id, img_url):
    if work_id not in workspace.keys():
        return False, 'work not found', 0
    img_path = img_url.replace(img_url_prefix, '')
    work = workspace[work_id]
    work['selected_list'].add(img_path)
    return True, '', len(work['selected_list'])


def handle_update_tags(work_id, video_url, tags):
    if work_id not in workspace.keys():
        return False, 'work not found', 0
    video_path = video_url.replace(img_url_prefix, '')
    work = workspace[work_id]
    work['tags_list'][video_path] = json.loads(tags)
    return True, '', len(work['tags_list'][video_path])


def handle_get_tags(work_id, video_url):
    if work_id not in workspace.keys():
        return False, 'work not found', 0
    video_path = video_url.replace(img_url_prefix, '')
    work = workspace[work_id]
    res = []
    if video_path in work['tags_list']:
        res = work['tags_list'][video_path]
    return True, '', len(work['tags_list']), res


def handle_deselect_sample(work_id, img_url):
    if work_id not in workspace.keys():
        return False, 'work not found', 0
    img_path = img_url.replace(img_url_prefix, '')
    work = workspace[work_id]
    work['selected_list'].remove(img_path)
    return True, '', len(work['selected_list'])


def handle_load_work(src_dir, dst_list_file, classify_type):
    if not os.path.exists(src_dir):
        return False, 'path is not exist: ' + src_dir, '', 0, 0
    work_id = str(hash(src_dir + ":" + dst_list_file) % 1000000)
    logging.info('load_work: work_id=' + work_id + ', src=' + src_dir + ', dst=' + dst_list_file)
    if (classify_type == 'video') or (classify_type == 'videotags'):
        src_file_list = list_videos(src_dir)
    else:
        src_file_list = list_images(src_dir)
    res_cnt = 0
    if classify_type == 'videotags':
        tags_list = {}
        if work_id in workspace.keys():
            work = workspace[work_id]
            tags_list = work['tags_list']
        oldtags = read_tags(dst_list_file)
        tags_list = merge_tags(oldtags, tags_list)
        workspace[work_id] = {'src_dir': src_dir, 'dst_list_file': dst_list_file,
                              'src_file_list': src_file_list, 'tags_list': tags_list}
        res_cnt = len(tags_list)
    else:
        selected_list = set()
        if work_id in workspace.keys():
            work = workspace[work_id]
            selected_list = work['selected_list']
        selected_list.update(read_lines_without_tail(dst_list_file))
        workspace[work_id] = {'src_dir': src_dir, 'dst_list_file': dst_list_file,
                              'src_file_list': src_file_list, 'selected_list': selected_list}
        res_cnt = len(selected_list)
    return True, '', work_id, len(src_file_list), res_cnt


def handle_get_batch_images(work_id, page_count, page_id):
    if work_id not in workspace.keys():
        return []
    work = workspace[work_id]
    file_list = work['src_file_list'][(page_count * page_id):(page_count * (page_id + 1))]
    res = []
    tkey = 'selected_list'
    if 'tags_list' in work:
        tkey = 'tags_list'
    for file_path in file_list:
        img_url = file_path
        selected = False
        if img_url in work[tkey]:
            selected = True
        if not img_url.startswith('http'):
            idx = img_url.find(':')
            if idx >= 0:
                img_url = img_url[(idx + 1):]
            img_url = img_url_prefix + img_url
        res.append({'url': img_url, 'selected': selected})
    return res


def handle_save_work(work_id, dst_list_file=None):
    if work_id not in workspace.keys():
        return False, 'work not found', 0, ''
    logging.info('save_work: work_id=' + work_id + ', dst=' + dst_list_file)
    work = workspace[work_id]
    res_cnt = 0
    try:
        if dst_list_file is not None:
            work['dst_list_file'] = dst_list_file
        if 'selected_list' in work:
            save_list_to_file(work['dst_list_file'], work['selected_list'])
            res_cnt = len(work['selected_list'])
        elif 'tags_list' in work:
            save_tags(work['tags_list'], work['dst_list_file'])
            res_cnt = len(work['tags_list'])
    except Exception as e:
        return False, e, 0, ''
    return True, '', res_cnt, work['dst_list_file']


def handle_merge_work(work_id, dst_list_file=None):
    if work_id not in workspace.keys():
        return False, 'work not found', 0, ''
    work = workspace[work_id]
    res_cnt = 0
    try:
        if dst_list_file is not None:
            work['dst_list_file'] = dst_list_file
        if 'selected_list' in work:
            lines = read_lines_without_tail(work['dst_list_file'])
            work['selected_list'] = set(work['selected_list']) | set(lines)
            save_list_to_file(work['dst_list_file'], work['selected_list'])
            res_cnt = len(work['selected_list'])
        elif 'tags_list' in work:
            oldtags = read_tags(work['dst_list_file'])
            newtags = merge_tags(oldtags, work['tags_list'])
            save_tags(newtags, work['dst_list_file'])
            res_cnt = len(work['tags_list'])
    except Exception as e:
        return False, e, 0, ''
    return True, '', res_cnt, work['dst_list_file']


def merge_taglist(a, b):
    sa = set()
    t = []
    for ta in a:
        ky = ta['tag'] + '-' + str(ta['start']) + '-' + str(ta['end'])
        if ky not in sa:
            sa.add(ky)
            t.append(ta)
    for tb in b:
        ky = tb['tag'] + '-' + str(tb['start']) + '-' + str(tb['end'])
        if ky not in sa:
            sa.add(ky)
            t.append(tb)
    return t


def merge_tags(ta, tb):
    tc = copy.deepcopy(ta)
    for key, value in tb.items():
        if key in tc.keys():
            tc[key] = merge_taglist(value, tc[key])
        else:
            tc[key] = value
    return tc


def read_tags(tags_file):
    if not os.path.exists(tags_file):
        return {}
    f = open(tags_file, 'r')
    tags = json.load(f)
    f.close()
    return tags


def save_tags(tags, tags_file):
    for ky in tags.keys():
        if len(tags[ky]) == 0:
            tags.pop(ky, None)
    fp = open(tags_file, 'w')
    json.dump(tags, fp)
    fp.close()


def save_list_to_file(filepath, lis):
    f = open(filepath, 'w')
    for t in lis:
        f.write(t + '\n')
    f.close()


def read_lines_without_tail(txt_file):
    lines = []
    try:
        f = open(txt_file, 'r')
        lines = f.readlines()
        f.close()
        for i in range(len(lines)):
            lines[i] = lines[i].replace('\r', '').replace('\n', '')
    except Exception as e:
        print(txt_file + str(e))
    return lines


def is_suffixes(filename, suffixes):
    filename_low = filename.lower()
    for suffix in suffixes:
        if filename_low.endswith(suffix):
            return True
    return False


def list_files(input_dir, suffixes):
    res = []
    if os.path.isdir(input_dir):
        for dirpath, dirnames, files in os.walk(input_dir):
            for filename in files:
                if is_suffixes(filename, suffixes):
                    res.append(dirpath + '/' + filename)
        res.sort()
    else:
        f = open(input_dir, 'r')
        lines = f.readlines()
        f.close()
        for line in lines:
            res.append(line.replace('\n', '').replace('\r', ''))
    return res


list_images = partial(list_files, suffixes=['.jpg', '.png', '.bmp', '.jpeg', '.webp'])
list_txts = partial(list_files, suffixes=['.txt'])
list_videos = partial(list_files, suffixes=['.mp4', '.avi', '.mpg'])


def save_and_unload_all_work():
    localtime = time.asctime(time.localtime(time.time()))
    print("[" + str(localtime) + "] save_and_unload_all_work()")
    for work_id in workspace.keys():
        handle_merge_work(work_id)
    workspace.clear()


def get_host_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip


# apscheduler, django
schedudler = BackgroundScheduler(daemonic=True)
img_url_prefix = 'http://' + get_host_ip() + ':4321'
print(img_url_prefix)
workspace = {}
atexit.register(save_and_unload_all_work)
try:
    schedudler.add_job(save_and_unload_all_work, 'cron', hour='6')
    schedudler.start()
except (KeyboardInterrupt, SystemExit):
    schedudler.shutdown()
