using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebRTC_Internship.Models
{
    public class VideochatContext : DbContext
    {
        public VideochatContext(DbContextOptions<VideochatContext> options)
            : base(options)
        {
        }
        public DbSet<Videochat> Videochats { get; set; }
    }
}
