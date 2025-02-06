# readme




## 环境

```
python3.6+

django2.2+


注意Nginx配置 （反向代理）

/etc/nginx/sites-enabled/default
(把默认的80端口改成4321端口；此端口是专门用来代理图片、文本等服务的)

重新启动nginx服务
systemctl restart nginx


```

/etc/nginx/sites-enabled/default
```



```




## 运行

sudo python3 manage.py runserver 0.0.0.0:5678

启动后，页面地址 http://IP:5678


python manage.py runserver 0.0.0.0:5678









