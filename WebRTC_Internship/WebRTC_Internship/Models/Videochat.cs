using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC_Internship.Models
{
    public class Videochat
    {
        public long ID { get; set; }
        public string UUID { get; set; }
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
    }
}
