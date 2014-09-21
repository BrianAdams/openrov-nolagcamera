#!/bin/sh

# set the openrov nolagcamera startup
ln -s /opt/openrov/nolagcamera/linux/nolagcamera.service /etc/init.d/nolagcamera
update-rc.d nolagcamera defaults 21

chown -R rov /opt/openrov/nolagcamera
chgrp -R admin /opt/openrov/nolagcamera
