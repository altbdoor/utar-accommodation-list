#!/usr/bin/env python
# -*- coding: utf-8 -*-

from os.path import dirname, join
import json
import re
import sys
import urllib2

# ========================================

def unicode_and_strip (_str):
	return unicode(_str).strip()

def remove_empty_string_and_nbsp_in_list (_list):
	return [ unicode_and_strip(x).replace(u'\xa0', u' ') for x in _list if unicode_and_strip(x) ]

# ========================================

# set path
print 'Cleaning up and setting paths'
current_path = dirname(__file__)
data_path = join(current_path, 'gh-pages/data')


# import bs4
sys.path.append(join(current_path, 'libs/bs4.zip'))
from bs4 import BeautifulSoup, SoupStrainer


# set base url and locations
base_url = 'http://www.utar.edu.my/accomList.jsp'

locations = {
	'Bandar Tun Hussien Onn / Mahkota Cheras / Balakong / Kajang': 'BTHO',
	'Kampar': 'KP',
	'Bandar Sungai Long': 'SL',
}

# tab_id_list = ['Room']
tab_id_list = ['Room', 'Roomate', 'Apartment/Condominium', 'House']

# loop the loop
for location_full_name, location_code in locations.iteritems():
	print 'Getting data for {}'.format(location_full_name)
	
	# prep some stuff
	current_data_path = join(data_path, '{}.json'.format(location_code.lower()))
	current_data_json = {}
	
	# send the request
	req = urllib2.Request(base_url, 'fcode={}'.format(location_code))
	res = urllib2.urlopen(req)
	
	# based bs4
	strainer = SoupStrainer(id="tabs")
	soup = BeautifulSoup(res.read(), 'html.parser', parse_only=strainer)
	tabs = soup.find('div', id="tabs").find_all('div', recursive=False)
	
	for tab in tabs:
		# gotta have an id
		if not (tab.has_attr('id') and tab['id'] in tab_id_list):
			continue
		
		tab_id = tab['id']
		current_data_json[tab_id] = []
		print '  Getting data for {}'.format(tab_id)
		
		rows = tab.find_all('tr')
		
		for row in rows:
			# gotta have this wacky event
			if not row.has_attr('onmouseout'):
				continue
			
			# find the columns
			cols = row.find_all('td', recursive=False)
			
			# prepare current row json
			current_row = {
				'name': cols[1].find('strong').contents[0],
				'link': cols[1].find('a')['href'],
				
				'office': 'N/A',
				'mobile': 'N/A',
				'email': 'N/A',
				
				'info': [],
				'price': [],
				'size': [],
				'count': [],
				
				'address': cols[3].text.strip(),
				'remark': [],
			}
			
			# contact
			temp = cols[1].find('b', text='H/P No.:')
			if temp is not None:
				current_row['mobile'] = unicode_and_strip(temp.next_sibling)
			
			temp = cols[1].find('b', text='Office No.:')
			if temp is not None:
				current_row['office'] = unicode_and_strip(temp.next_sibling)
			
			temp = cols[1].find('b', text='Email:')
			if temp is not None:
				current_row['email'] = unicode_and_strip(temp.next_sibling)
			
			# if no means of contact, why bother?
			if current_row['office'] == 'N/A' and current_row['mobile'] == 'N/A' and current_row['email'] == 'N/A':
				continue
			
			# info
			temp = cols[2]
			for x in temp.find_all('font'):
				x.extract()
			
			temp = temp.find_all(text=True)
			current_row['info'] = remove_empty_string_and_nbsp_in_list(temp)
			
			for info in current_row['info']:
				# price
				temp = re.compile('RM (\d+)').search(info)
				if temp is not None:
					current_row['price'].append( int(temp.group(1)) )
				
				# size and count
				temp = re.compile('(Small|Middle|Master) Bedroom \/ RM (\d+) \/ (.*?)persons?').search(info)
				if temp is not None:
					current_row['size'].append(
						unicode_and_strip(temp.group(1))
					)
					current_row['count'].append(
						unicode_and_strip(temp.group(3))
					)
			
			# address
			current_row['address'] = re.compile('(\\r)?\\n').sub(' ', current_row['address']) \
				.replace(',,', ',')
			
			# remark
			temp = cols[4].find_all(text=True)
			current_row['remark'] = remove_empty_string_and_nbsp_in_list(temp)
			
			# into the json
			current_data_json[tab_id].append(current_row)
	
	# write to json
	f = open(current_data_path, 'w')
	f.truncate()
	f.write(json.dumps(current_data_json, indent=4))
	# f.write(json.dumps(current_data_json))
	f.close()

print 'Done'
