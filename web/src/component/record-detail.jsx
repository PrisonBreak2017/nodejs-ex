/**
 * The panel to display the detial of the record
 *
 */

import React, { PropTypes } from 'react';
import ClassBind from 'classnames/bind';
import { Menu, Table, notification, Spin } from 'antd';
import clipboard from 'clipboard-js'
import JsonViewer from 'component/json-viewer';
import ModalPanel from 'component/modal-panel';
import { hideRecordDetail } from 'action/recordAction';
import { selectText } from 'common/CommonUtil';
import { curlify } from 'common/curlUtil';

import Style from './record-detail.less';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);
const PageIndexMap = {
  REQUEST_INDEX: 'REQUEST_INDEX',
  RESPONSE_INDEX: 'RESPONSE_INDEX'
};

class RecordDetail extends React.Component {
  constructor() {
    super();
    this.onClose = this.onClose.bind(this);
    this.state = {
      pageIndex: PageIndexMap.REQUEST_INDEX
    };

    this.onMenuChange = this.onMenuChange.bind(this);
    this.copyCurlCmd = this.copyCurlCmd.bind(this)
  }

  static propTypes = {
    dispatch: PropTypes.func,
    globalStatus: PropTypes.object,
    requestRecord: PropTypes.object
  }

  onClose() {
    this.props.dispatch(hideRecordDetail());
  }

  onMenuChange(e) {
    this.setState({
      pageIndex: e.key,
    });
  }

  onSelectText(e) {
    selectText(e.target);
  }

  getLiDivs(targetObj) {
    const liDom = Object.keys(targetObj).map((key) => {
      return (
        <li key={key} className={Style.liItem} >
          <strong>{key} : </strong>
          <span>{targetObj[key]}</span>
        </li>
      );
    });

    return liDom;
  }

  getImageBody(recordDetail) {
    return <img src={recordDetail.ref} className={Style.imageBody} />;
  }

  getJsonBody(recordDetail) {
    return <JsonViewer data={recordDetail.resBody} />;
  }

  getCookieDiv(cookies) {
    let cookieArray = [];
    if (cookies) {
      const cookieStringArray = cookies.split(';');
      cookieArray = cookieStringArray.map((cookieString) => {
        const cookie = cookieString.split('=');
        return {
          name: cookie[0],
          value: cookie.slice(1).join('=') // cookie的值本身可能含有"=", 此处进行修正
        };
      });
    } else {
      return <div className={Style.noCookes}>No Cookies</div>;
    }
    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 300
      },
      {
        title: 'Value',
        dataIndex: 'value'
      }
    ];

    const rowClassFunc = function (record, index) {
      // return index % 2 === 0 ? null : Style.odd;
      return null;
    };

    const locale = {
      emptyText: 'No Cookies'
    };

    return (
      <div className={Style.cookieWrapper} >
        <Table
          columns={columns}
          dataSource={cookieArray}
          pagination={false}
          size="middle"
          rowClassName={rowClassFunc}
          bordered
          locale={locale}
          rowKey="name"
        />
      </div>
    );
  }

  getReqBodyDiv() {
    const { recordDetail } = this.props.requestRecord;
    return (
      <div className={Style.reqBody} >
        {recordDetail.reqBody}
      </div>
    );
  }

  notify(message, type = 'info', duration = 1.6, opts = {}) {
    notification[type]({ message, duration, ...opts })
  }

  copyCurlCmd() {
    const { recordDetail } = this.props.requestRecord
    clipboard
      .copy(curlify(recordDetail))
      .then(() => this.notify('COPY SUCCESS', 'success'))
      .catch(() => this.notify('COPY FAILED', 'error'))
  }

  getResBodyDiv() {
    const { recordDetail } = this.props.requestRecord;

    const self = this;

    let reqBodyDiv = <div className={Style.codeWrapper}> <pre>{recordDetail.resBody} </pre></div>;

    switch (recordDetail.type) {
      case 'image': {
        reqBodyDiv = <div > {self.getImageBody(recordDetail)} </div>;
        break;
      }
      case 'json': {
        reqBodyDiv = self.getJsonBody(recordDetail);
        break;
      }

      default: {
        if (!recordDetail.resBody && recordDetail.ref) {
          reqBodyDiv = <a href={recordDetail.ref} target="_blank">{recordDetail.fileName}</a>;
        }
        break;
      }
    }

    return (
      <div className={Style.resBody} >
        {reqBodyDiv}
      </div>
    );
  }

  getRequestDiv(recordDetail) {
    const reqHeader = Object.assign({}, recordDetail.reqHeader);
    const cookieString = reqHeader.cookie || reqHeader.Cookie;
    delete reqHeader.cookie; // cookie will be displayed seperately

    const { protocol, host, path } = recordDetail;
    return (
      <div>
        <div className={Style.section} >
          <div >
            <span className={CommonStyle.sectionTitle}>General</span>
          </div>
          <div className={CommonStyle.whiteSpace10} />
          <ul className={Style.ulItem} >
            <li className={Style.liItem} >
              <strong>Method:</strong>
              <span>{recordDetail.method} </span>
            </li>
            <li className={Style.liItem} >
              <strong>URL:</strong>
              <span onClick={this.onSelectText} >{`${protocol}://${host}${path}`} </span>
            </li>
            <li className={Style.liItem} >
              <strong>Protocol:</strong>
              <span >HTTP/1.1</span>
            </li>
          </ul>
          <div className={CommonStyle.whiteSpace10} />
          <ul className={Style.ulItem} >
            <li className={Style.liItem} >
              <strong>CURL:</strong>
              <span>
                <a href="javascript:void(0)" onClick={this.copyCurlCmd} >copy as CURL</a>
              </span>
            </li>
          </ul>
        </div>
        <div className={Style.section} >
          <div >
            <span className={CommonStyle.sectionTitle}>Header</span>
          </div>
          <div className={CommonStyle.whiteSpace10} />
          <ul className={Style.ulItem} >
            {this.getLiDivs(reqHeader)}
          </ul>
        </div>

        <div className={Style.section + ' ' + Style.noBorder} >
          <div >
            <span className={CommonStyle.sectionTitle}>Cookies</span>
          </div>
          {this.getCookieDiv(cookieString)}
        </div>

        <div className={Style.section} >
          <div >
            <span className={CommonStyle.sectionTitle}>Body</span>
          </div>
          <div className={CommonStyle.whiteSpace10} />
          {this.getReqBodyDiv()}
        </div>
      </div>
    );
  }

  getResponseDiv(recordDetail) {
    const statusStyle = StyleBind({ okStatus: recordDetail.statusCode === 200 });

    return (
      <div>
        <div className={Style.section} >
          <div >
            <span className={CommonStyle.sectionTitle}>General</span>
          </div>
          <div className={CommonStyle.whiteSpace10} />
          <ul className={Style.ulItem} >
            <li className={Style.liItem} >
              <strong>Status Code:</strong>
              <span className={statusStyle} > {recordDetail.statusCode} </span>
            </li>
          </ul>
        </div>
        <div className={Style.section} >
          <div >
            <span className={CommonStyle.sectionTitle}>Header</span>
          </div>
          <div className={CommonStyle.whiteSpace10} />
          <ul className={Style.ulItem} >
            {this.getLiDivs(recordDetail.resHeader)}
          </ul>
        </div>

        <div className={Style.section} >
          <div >
            <span className={CommonStyle.sectionTitle}>Body</span>
          </div>
          <div className={CommonStyle.whiteSpace10} />
          {this.getResBodyDiv()}
        </div>
      </div>
    );
  }

  getRecordContentDiv(recordDetail, fetchingRecord) {
    const getMenuBody = () => {
      const menuBody = this.state.pageIndex === PageIndexMap.REQUEST_INDEX ?
        this.getRequestDiv(recordDetail) : this.getResponseDiv(recordDetail);
      return menuBody;
    }

    return (
      <div className={Style.wrapper} >
        <Menu onClick={this.onMenuChange} mode="horizontal" selectedKeys={[this.state.pageIndex]} >
          <Menu.Item key={PageIndexMap.REQUEST_INDEX}>Request</Menu.Item>
          <Menu.Item key={PageIndexMap.RESPONSE_INDEX}>Response</Menu.Item>
        </Menu>
        <div className={Style.detailWrapper} >
          {fetchingRecord ? this.getLoaingDiv() : getMenuBody()}
        </div>
      </div>
    );
  }

  getLoaingDiv() {
    return (
      <div className={Style.loading}>
        <Spin />
        <div className={Style.loadingText}>LOADING...</div>
      </div>
    );
  }

  getRecordDetailDiv() {
    const recordDetail = this.props.requestRecord.recordDetail;
    const fetchingRecord = this.props.globalStatus.fetchingRecord;

    if (!recordDetail && !fetchingRecord) {
      return null;
    }
    return this.getRecordContentDiv(recordDetail, fetchingRecord);
  }

  render() {
    return (
      <ModalPanel
        onClose={this.onClose}
        hideBackModal
        visible={this.props.requestRecord.recordDetail !== null}
        left="50%"
      >
        {this.getRecordDetailDiv()}
      </ModalPanel>
    );
  }
}

export default RecordDetail;
